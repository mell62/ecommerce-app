import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const orderFindFirstMock = vi.hoisted(() => vi.fn());
const orderUpdateMock = vi.hoisted(() => vi.fn());
const checkoutSessionCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findFirst: orderFindFirstMock,
      update: orderUpdateMock,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: checkoutSessionCreateMock,
      },
    },
  }),
}));

const currentUser = {
  id: "customer-1",
  name: "Alex Morgan",
  email: "alex@example.com",
};

const pendingOrder = {
  id: "order-1",
  shippingCost: 5.99,
  estimatedTax: 4.08,
  shippingFullName: "Alex Morgan",
  shippingAddressLine1: "123 Technology Avenue",
  shippingAddressLine2: "Apartment 4B",
  shippingCity: "Austin",
  shippingState: "Texas",
  shippingPostalCode: "78701",
  shippingCountry: "US",
  items: [
    {
      quantity: 1,
      price: 50.99,
      product: {
        name: "Zeus Wireless Mouse",
      },
    },
  ],
};

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/checkout/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Stripe Checkout Session API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(currentUser);
    orderFindFirstMock.mockResolvedValue(pendingOrder);
    checkoutSessionCreateMock.mockResolvedValue({
      id: "cs_test_checkout",
      url: "https://checkout.stripe.com/c/pay/test",
    });
    orderUpdateMock.mockResolvedValue({
      id: pendingOrder.id,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires an authenticated customer", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await POST(createRequest({ orderId: pendingOrder.id }));

    expect(response.status).toBe(401);
    expect(orderFindFirstMock).not.toHaveBeenCalled();
  });

  it.each([{}, { orderId: "" }, { orderId: 123 }])(
    "rejects invalid request body %#",
    async (body) => {
      const response = await POST(createRequest(body));

      expect(response.status).toBe(400);
      expect(checkoutSessionCreateMock).not.toHaveBeenCalled();
    }
  );

  it("does not expose another customer's order", async () => {
    orderFindFirstMock.mockResolvedValue(null);

    const response = await POST(createRequest({ orderId: "other-order" }));

    expect(response.status).toBe(404);
    expect(orderFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "other-order",
          userId: currentUser.id,
          paymentStatus: PaymentStatus.PENDING,
        },
      })
    );
    expect(checkoutSessionCreateMock).not.toHaveBeenCalled();
  });

  it("rejects an order without a complete shipping address", async () => {
    orderFindFirstMock.mockResolvedValue({
      ...pendingOrder,
      shippingPostalCode: null,
    });

    const response = await POST(createRequest({ orderId: pendingOrder.id }));

    expect(response.status).toBe(409);
    expect(checkoutSessionCreateMock).not.toHaveBeenCalled();
  });

  it("creates one idempotent Stripe Checkout Session from stored order data", async () => {
    const response = await POST(createRequest({ orderId: pendingOrder.id }));

    expect(response.status).toBe(201);
    expect(checkoutSessionCreateMock).toHaveBeenCalledWith(
      {
        mode: "payment",
        submit_type: "pay",
        customer_email: currentUser.email,
        client_reference_id: pendingOrder.id,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Zeus Wireless Mouse",
              },
              unit_amount: 5099,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Standard shipping",
              },
              unit_amount: 599,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Estimated tax",
              },
              unit_amount: 408,
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderId: pendingOrder.id,
          userId: currentUser.id,
        },
        payment_intent_data: {
          metadata: {
            orderId: pendingOrder.id,
            userId: currentUser.id,
          },
          shipping: {
            name: "Alex Morgan",
            address: {
              line1: "123 Technology Avenue",
              line2: "Apartment 4B",
              city: "Austin",
              state: "Texas",
              postal_code: "78701",
              country: "US",
            },
          },
        },
        success_url:
          "http://localhost:3000/orders?payment=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url:
          "http://localhost:3000/orders?payment=cancelled&order_id=order-1",
      },
      {
        idempotencyKey: "checkout-session:order-1",
      }
    );
    expect(orderUpdateMock).toHaveBeenCalledWith({
      where: {
        id: pendingOrder.id,
      },
      data: {
        paymentProvider: PaymentProvider.STRIPE,
        stripeCheckoutSessionId: "cs_test_checkout",
      },
    });
    expect(await response.json()).toEqual({
      checkoutUrl: "https://checkout.stripe.com/c/pay/test",
    });
  });

  it("does not persist a session ID when Stripe fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    checkoutSessionCreateMock.mockRejectedValue(new Error("Stripe unavailable"));

    const response = await POST(createRequest({ orderId: pendingOrder.id }));

    expect(response.status).toBe(500);
    expect(orderUpdateMock).not.toHaveBeenCalled();
  });
});
