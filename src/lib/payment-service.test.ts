import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { failPendingOrder, markOrderPaid } from "@/lib/payment-service";

const transactionMock = vi.hoisted(() => vi.fn());
const orderFindUniqueMock = vi.hoisted(() => vi.fn());
const orderUpdateManyMock = vi.hoisted(() => vi.fn());
const productUpdateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));

const transactionClient = {
  order: {
    findUnique: orderFindUniqueMock,
    updateMany: orderUpdateManyMock,
  },
  product: {
    update: productUpdateMock,
  },
};

const reference = {
  orderId: "order-1",
  userId: "customer-1",
  sessionId: "cs_test_checkout",
  amountTotal: 6106,
  currency: "usd",
};

const pendingOrder = {
  userId: reference.userId,
  totalPrice: 61.06,
  paymentStatus: PaymentStatus.PENDING,
  stripeCheckoutSessionId: reference.sessionId,
  items: [
    {
      productId: "product-1",
      quantity: 2,
    },
  ],
};

describe("payment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (callback) =>
      callback(transactionClient)
    );
    orderFindUniqueMock.mockResolvedValue(pendingOrder);
    orderUpdateManyMock.mockResolvedValue({ count: 1 });
    productUpdateMock.mockResolvedValue({ id: "product-1" });
  });

  it("marks a pending order as paid from a matching Stripe payment", async () => {
    const paidAt = new Date("2026-09-05T10:00:00.000Z");

    await expect(
      markOrderPaid({
        ...reference,
        paymentIntentId: "pi_test_payment",
        paidAt,
      })
    ).resolves.toBe("paid");

    expect(orderUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: reference.orderId,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: {
        status: "PROCESSING",
        paymentStatus: PaymentStatus.PAID,
        paymentProvider: PaymentProvider.STRIPE,
        stripeCheckoutSessionId: reference.sessionId,
        stripePaymentIntentId: "pi_test_payment",
        paidAt,
      },
    });
  });

  it("does not process an already-paid order twice", async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...pendingOrder,
      paymentStatus: PaymentStatus.PAID,
    });

    await expect(
      markOrderPaid({
        ...reference,
        paymentIntentId: "pi_test_payment",
        paidAt: new Date(),
      })
    ).resolves.toBe("already-processed");

    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });

  it("rejects a Stripe amount that does not match the stored order total", async () => {
    await expect(
      markOrderPaid({
        ...reference,
        amountTotal: 9999,
        paymentIntentId: "pi_test_payment",
        paidAt: new Date(),
      })
    ).rejects.toThrow("amount does not match");

    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });

  it("marks an unpaid expired order as failed and restores its stock", async () => {
    await expect(failPendingOrder(reference)).resolves.toBe("failed");

    expect(orderUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: reference.orderId,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: {
        status: "CANCELLED",
        paymentStatus: PaymentStatus.FAILED,
        paymentProvider: PaymentProvider.STRIPE,
        stripeCheckoutSessionId: reference.sessionId,
      },
    });
    expect(productUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      data: {
        stockCount: {
          increment: 2,
        },
      },
    });
  });

  it("does not restore stock twice for a repeated failure event", async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...pendingOrder,
      paymentStatus: PaymentStatus.FAILED,
    });

    await expect(failPendingOrder(reference)).resolves.toBe(
      "already-processed"
    );

    expect(orderUpdateManyMock).not.toHaveBeenCalled();
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects a session belonging to a different customer", async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...pendingOrder,
      userId: "another-customer",
    });

    await expect(failPendingOrder(reference)).rejects.toThrow(
      "customer does not match"
    );

    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });
});
