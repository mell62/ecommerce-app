import type Stripe from "stripe";
import { failPendingOrder, markOrderPaid } from "@/lib/payment-service";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

function getOrderReference(session: Stripe.Checkout.Session) {
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

function getPaymentIntentId(session: Stripe.Checkout.Session): string {
  const paymentIntent = session.payment_intent;

  if (typeof paymentIntent === "string") {
    return paymentIntent;
  }

  if (paymentIntent?.id) {
    return paymentIntent.id;
  }

  throw new Error("Stripe Checkout Session is missing a Payment Intent.");
}

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { error: "Stripe signature is required." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret()
    );
  } catch {
    return Response.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;

    switch (event.type) {
      case "checkout.session.completed":
        if (session.payment_status !== "paid") {
          break;
        }

        await markOrderPaid({
          ...getOrderReference(session),
          paymentIntentId: getPaymentIntentId(session),
          paidAt: new Date(event.created * 1000),
        });
        break;

      case "checkout.session.async_payment_succeeded":
        await markOrderPaid({
          ...getOrderReference(session),
          paymentIntentId: getPaymentIntentId(session),
          paidAt: new Date(event.created * 1000),
        });
        break;

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await failPendingOrder(getOrderReference(session));
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to process Stripe webhook." },
      { status: 500 }
    );
  }
}
