import { PaymentProvider, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toStripeAmount } from "@/lib/stripe-checkout";

export type StripeOrderReference = Readonly<{
  orderId: string;
  userId: string;
  sessionId: string;
  amountTotal: number;
  currency: string;
}>;

export type StripeSuccessfulPayment = StripeOrderReference &
  Readonly<{
    paymentIntentId: string;
    paidAt: Date;
  }>;

function assertMatchingOrder(
  order: {
    userId: string;
    totalPrice: number;
    stripeCheckoutSessionId: string | null;
  } | null,
  reference: StripeOrderReference
): asserts order is {
  userId: string;
  totalPrice: number;
  stripeCheckoutSessionId: string | null;
} {
  if (!order) {
    throw new Error("Stripe webhook order not found.");
  }

  if (order.userId !== reference.userId) {
    throw new Error("Stripe webhook customer does not match the order.");
  }

  if (
    order.stripeCheckoutSessionId &&
    order.stripeCheckoutSessionId !== reference.sessionId
  ) {
    throw new Error("Stripe Checkout Session does not match the order.");
  }

  if (
    reference.currency.toLowerCase() !== "usd" ||
    toStripeAmount(order.totalPrice) !== reference.amountTotal
  ) {
    throw new Error("Stripe payment amount does not match the order total.");
  }
}

export async function markOrderPaid(
  payment: StripeSuccessfulPayment
): Promise<"paid" | "already-processed"> {
  return prisma.$transaction(
    async (transaction) => {
      const order = await transaction.order.findUnique({
        where: {
          id: payment.orderId,
        },
        select: {
          userId: true,
          totalPrice: true,
          paymentStatus: true,
          stripeCheckoutSessionId: true,
        },
      });

      assertMatchingOrder(order, payment);

      if (order.paymentStatus === PaymentStatus.PAID) {
        return "already-processed";
      }

      if (order.paymentStatus !== PaymentStatus.PENDING) {
        throw new Error("The order is not awaiting payment.");
      }

      const updateResult = await transaction.order.updateMany({
        where: {
          id: payment.orderId,
          paymentStatus: PaymentStatus.PENDING,
        },
        data: {
          status: "PROCESSING",
          paymentStatus: PaymentStatus.PAID,
          paymentProvider: PaymentProvider.STRIPE,
          stripeCheckoutSessionId: payment.sessionId,
          stripePaymentIntentId: payment.paymentIntentId,
          paidAt: payment.paidAt,
        },
      });

      if (updateResult.count !== 1) {
        throw new Error("The order payment status changed concurrently.");
      }

      return "paid";
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

export async function failPendingOrder(
  reference: StripeOrderReference
): Promise<"failed" | "already-processed"> {
  return prisma.$transaction(
    async (transaction) => {
      const order = await transaction.order.findUnique({
        where: {
          id: reference.orderId,
        },
        select: {
          userId: true,
          totalPrice: true,
          paymentStatus: true,
          stripeCheckoutSessionId: true,
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      assertMatchingOrder(order, reference);

      if (order.paymentStatus !== PaymentStatus.PENDING) {
        return "already-processed";
      }

      const updateResult = await transaction.order.updateMany({
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

      if (updateResult.count !== 1) {
        throw new Error("The order payment status changed concurrently.");
      }

      for (const item of order.items) {
        await transaction.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stockCount: {
              increment: item.quantity,
            },
          },
        });
      }

      return "failed";
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}
