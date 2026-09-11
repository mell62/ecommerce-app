import { PaymentStatus } from "@prisma/client";
import { markOrderPaid } from "@/lib/payment-service";
import { getCurrentUser } from "@/lib/session";
import { getStripeClient } from "@/lib/stripe";
import {
  getStripeOrderReference,
  getStripePaymentIntentId,
} from "@/lib/stripe-session";

type StatusRequestBody = Readonly<{
  sessionId: string;
}>;

async function getRequestBody(request: Request): Promise<StatusRequestBody | null> {
  try {
    const body: unknown = await request.json();

    if (
      typeof body === "object" &&
      body !== null &&
      !Array.isArray(body) &&
      "sessionId" in body &&
      typeof body.sessionId === "string" &&
      body.sessionId.trim().startsWith("cs_")
    ) {
      return {
        sessionId: body.sessionId.trim(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to verify payment." },
        { status: 401 }
      );
    }

    const body = await getRequestBody(request);

    if (!body) {
      return Response.json(
        { error: "A valid Checkout Session ID is required." },
        { status: 400 }
      );
    }

    const session = await getStripeClient().checkout.sessions.retrieve(
      body.sessionId
    );
    const reference = getStripeOrderReference(session);

    if (reference.userId !== user.id) {
      return Response.json({ error: "Checkout Session not found." }, { status: 404 });
    }

    if (session.payment_status !== "paid") {
      return Response.json({ paymentStatus: PaymentStatus.PENDING });
    }

    await markOrderPaid({
      ...reference,
      paymentIntentId: getStripePaymentIntentId(session),
      paidAt: new Date(),
    });

    return Response.json({ paymentStatus: PaymentStatus.PAID });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to verify Stripe payment." },
      { status: 500 }
    );
  }
}
