import type Stripe from "stripe";
import type { StripeOrderReference } from "@/lib/payment-service";

export function getStripeOrderReference(
  session: Stripe.Checkout.Session
): StripeOrderReference {
  const orderId = session.metadata?.orderId;
  const userId = session.metadata?.userId;

  if (
    !orderId ||
    !userId ||
    session.amount_total === null ||
    !session.currency
  ) {
    throw new Error("Stripe Checkout Session metadata is incomplete.");
  }

  return {
    orderId,
    userId,
    sessionId: session.id,
    amountTotal: session.amount_total,
    currency: session.currency,
  };
}

export function getStripePaymentIntentId(
  session: Stripe.Checkout.Session
): string {
  const paymentIntent = session.payment_intent;

  if (typeof paymentIntent === "string") {
    return paymentIntent;
  }

  if (paymentIntent?.id) {
    return paymentIntent.id;
  }

  throw new Error("Stripe Checkout Session is missing a Payment Intent.");
}
