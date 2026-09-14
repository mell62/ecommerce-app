import { PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const checkoutSessionRetrieveMock = vi.hoisted(() => vi.fn());
const markOrderPaidMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        retrieve: checkoutSessionRetrieveMock,
      },
    },
  }),
}));

vi.mock("@/lib/payment-service", () => ({
  markOrderPaid: markOrderPaidMock,
}));

const checkoutSession = {
  id: "cs_test_checkout",
  amount_total: 6106,
  currency: "usd",
  metadata: {
    orderId: "order-1",
    userId: "customer-1",
  },
  payment_intent: "pi_test_payment",
  payment_status: "paid",
};

function createRequest(
  body: unknown,
  origin = "http://localhost:3000"
): Request {
  return new Request("http://localhost:3000/api/checkout/session/status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify(body),
  });
}

describe("Stripe Checkout status API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({ id: "customer-1" });
    checkoutSessionRetrieveMock.mockResolvedValue(checkoutSession);
    markOrderPaidMock.mockResolvedValue("paid");
  });

  it("rejects cross-site payment verification before authentication", async () => {
    const response = await POST(
      createRequest(
        { sessionId: checkoutSession.id },
        "https://malicious.example"
      )
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Cross-site requests are not allowed.",
    });
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(checkoutSessionRetrieveMock).not.toHaveBeenCalled();
    expect(markOrderPaidMock).not.toHaveBeenCalled();
  });

  it("requires an authenticated customer", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await POST(
      createRequest({ sessionId: checkoutSession.id })
    );

    expect(response.status).toBe(401);
    expect(checkoutSessionRetrieveMock).not.toHaveBeenCalled();
  });

  it.each([{}, { sessionId: "" }, { sessionId: "invalid" }, { sessionId: 1 }])(
    "rejects invalid request body %#",
    async (body) => {
      const response = await POST(createRequest(body));

      expect(response.status).toBe(400);
      expect(checkoutSessionRetrieveMock).not.toHaveBeenCalled();
    }
  );

  it("does not reconcile a Session belonging to another customer", async () => {
    checkoutSessionRetrieveMock.mockResolvedValue({
      ...checkoutSession,
      metadata: {
        ...checkoutSession.metadata,
        userId: "another-customer",
      },
    });

    const response = await POST(
      createRequest({ sessionId: checkoutSession.id })
    );

    expect(response.status).toBe(404);
    expect(markOrderPaidMock).not.toHaveBeenCalled();
  });

  it("returns pending without updating the order when Stripe is unpaid", async () => {
    checkoutSessionRetrieveMock.mockResolvedValue({
      ...checkoutSession,
      payment_status: "unpaid",
    });

    const response = await POST(
      createRequest({ sessionId: checkoutSession.id })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      paymentStatus: PaymentStatus.PENDING,
    });
    expect(markOrderPaidMock).not.toHaveBeenCalled();
  });

  it("reconciles a verified paid Session with the stored order", async () => {
    const response = await POST(
      createRequest({ sessionId: checkoutSession.id })
    );

    expect(response.status).toBe(200);
    expect(checkoutSessionRetrieveMock).toHaveBeenCalledWith(
      checkoutSession.id
    );
    expect(markOrderPaidMock).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "customer-1",
      sessionId: checkoutSession.id,
      amountTotal: 6106,
      currency: "usd",
      paymentIntentId: "pi_test_payment",
      paidAt: expect.any(Date),
    });
    expect(await response.json()).toEqual({
      paymentStatus: PaymentStatus.PAID,
    });
  });

  it("returns a server error when Stripe retrieval fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    checkoutSessionRetrieveMock.mockRejectedValue(new Error("Stripe down"));

    const response = await POST(
      createRequest({ sessionId: checkoutSession.id })
    );

    expect(response.status).toBe(500);
    expect(markOrderPaidMock).not.toHaveBeenCalled();
  });
});
