import type Stripe from "stripe";
import { failPendingOrder, markOrderPaid } from "@/lib/payment-service";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";
import {
  getStripeOrderReference,
  getStripePaymentIntentId,
} from "@/lib/stripe-session";

export const runtime = "nodejs";

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
          ...getStripeOrderReference(session),
          paymentIntentId: getStripePaymentIntentId(session),
          paidAt: new Date(event.created * 1000),
        });
        break;

      case "checkout.session.async_payment_succeeded":
        await markOrderPaid({
          ...getStripeOrderReference(session),
          paymentIntentId: getStripePaymentIntentId(session),
          paidAt: new Date(event.created * 1000),
        });
        break;

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await failPendingOrder(getStripeOrderReference(session));
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
