import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const constructEventMock = vi.hoisted(() => vi.fn());
const markOrderPaidMock = vi.hoisted(() => vi.fn());
const failPendingOrderMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: constructEventMock,
    },
  }),
  getStripeWebhookSecret: () => "whsec_test",
}));

vi.mock("@/lib/payment-service", () => ({
  markOrderPaid: markOrderPaidMock,
  failPendingOrder: failPendingOrderMock,
}));

function createRequest(body = "raw Stripe payload", signature?: string): Request {
  const headers = new Headers();

  if (signature) {
    headers.set("stripe-signature", signature);
  }

  return new Request("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  });
}

function createCheckoutEvent(
  type: Stripe.Event.Type,
  overrides: Partial<Stripe.Checkout.Session> = {}
): Stripe.Event {
  return {
    id: "evt_test_checkout",
    object: "event",
    api_version: "2026-08-27.basil",
    created: 1_788_601_200,
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type,
    data: {
      object: {
        id: "cs_test_checkout",
        object: "checkout.session",
        amount_total: 6106,
        currency: "usd",
        metadata: {
          orderId: "order-1",
          userId: "customer-1",
        },
        payment_intent: "pi_test_payment",
        payment_status: "paid",
        ...overrides,
      } as Stripe.Checkout.Session,
    },
  } as Stripe.Event;
}

describe("Stripe webhook API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markOrderPaidMock.mockResolvedValue("paid");
    failPendingOrderMock.mockResolvedValue("failed");
  });

  it("requires the Stripe signature header", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("rejects a payload with an invalid signature", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const response = await POST(createRequest("exact raw body", "sig_test"));

    expect(response.status).toBe(400);
    expect(constructEventMock).toHaveBeenCalledWith(
      "exact raw body",
      "sig_test",
      "whsec_test"
    );
  });

  it("marks an immediately paid Checkout Session as paid", async () => {
    constructEventMock.mockReturnValue(
      createCheckoutEvent("checkout.session.completed")
    );

    const response = await POST(createRequest("payload", "sig_test"));

    expect(response.status).toBe(200);
    expect(markOrderPaidMock).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "customer-1",
      sessionId: "cs_test_checkout",
      amountTotal: 6106,
      currency: "usd",
      paymentIntentId: "pi_test_payment",
      paidAt: new Date(1_788_601_200 * 1000),
    });
    expect(failPendingOrderMock).not.toHaveBeenCalled();
  });

  it("waits for a delayed payment when Checkout first completes unpaid", async () => {
    constructEventMock.mockReturnValue(
      createCheckoutEvent("checkout.session.completed", {
        payment_status: "unpaid",
      })
    );

    const response = await POST(createRequest("payload", "sig_test"));

    expect(response.status).toBe(200);
    expect(markOrderPaidMock).not.toHaveBeenCalled();
    expect(failPendingOrderMock).not.toHaveBeenCalled();
  });

  it("marks a delayed payment as paid after Stripe confirms it", async () => {
    constructEventMock.mockReturnValue(
      createCheckoutEvent("checkout.session.async_payment_succeeded")
    );

    const response = await POST(createRequest("payload", "sig_test"));

    expect(response.status).toBe(200);
    expect(markOrderPaidMock).toHaveBeenCalledOnce();
  });

  it.each([
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
  ] as const)("fails the pending order for %s", async (eventType) => {
    constructEventMock.mockReturnValue(createCheckoutEvent(eventType));

    const response = await POST(createRequest("payload", "sig_test"));

    expect(response.status).toBe(200);
    expect(failPendingOrderMock).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "customer-1",
      sessionId: "cs_test_checkout",
      amountTotal: 6106,
      currency: "usd",
    });
    expect(markOrderPaidMock).not.toHaveBeenCalled();
  });

  it("acknowledges unrelated Stripe events without changing an order", async () => {
    constructEventMock.mockReturnValue(
      createCheckoutEvent("customer.created")
    );

    const response = await POST(createRequest("payload", "sig_test"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(markOrderPaidMock).not.toHaveBeenCalled();
    expect(failPendingOrderMock).not.toHaveBeenCalled();
  });

  it("asks Stripe to retry when database processing fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    constructEventMock.mockReturnValue(
      createCheckoutEvent("checkout.session.completed")
    );
    markOrderPaidMock.mockRejectedValue(new Error("Database unavailable"));

    const response = await POST(createRequest("payload", "sig_test"));

    expect(response.status).toBe(500);
  });
});
