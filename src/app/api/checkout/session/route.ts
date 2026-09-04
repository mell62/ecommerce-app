import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getStripeClient } from "@/lib/stripe";
import { buildStripeCheckoutLineItems } from "@/lib/stripe-checkout";

type CheckoutSessionRequestBody = Readonly<{
  orderId: string;
}>;

function isCheckoutSessionRequestBody(
  value: unknown
): value is CheckoutSessionRequestBody {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "orderId" in value &&
    typeof value.orderId === "string" &&
    Boolean(value.orderId.trim())
  );
}

async function getRequestBody(
  request: Request
): Promise<CheckoutSessionRequestBody | null> {
  try {
    const body: unknown = await request.json();
    return isCheckoutSessionRequestBody(body) ? body : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to start payment." },
        { status: 401 }
      );
    }

    const body = await getRequestBody(request);

    if (!body) {
      return Response.json(
        { error: "A valid order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: body.orderId.trim(),
        userId: user.id,
        paymentStatus: PaymentStatus.PENDING,
      },
      select: {
        id: true,
        shippingCost: true,
        estimatedTax: true,
        shippingFullName: true,
        shippingAddressLine1: true,
        shippingAddressLine2: true,
        shippingCity: true,
        shippingState: true,
        shippingPostalCode: true,
        shippingCountry: true,
        items: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return Response.json(
        { error: "Pending order not found." },
        { status: 404 }
      );
    }

    if (
      !order.shippingFullName ||
      !order.shippingAddressLine1 ||
      !order.shippingCity ||
      !order.shippingState ||
      !order.shippingPostalCode ||
      !order.shippingCountry
    ) {
      return Response.json(
        { error: "The order does not have a complete shipping address." },
        { status: 409 }
      );
    }

    const checkoutMetadata = {
      orderId: order.id,
      userId: user.id,
    };
    const lineItems = buildStripeCheckoutLineItems(
      order.items.map((item) => ({
        name: item.product.name,
        unitPrice: item.price,
        quantity: item.quantity,
      })),
      {
        shippingCost: order.shippingCost,
        estimatedTax: order.estimatedTax,
      }
    );
    const applicationOrigin = new URL(request.url).origin;
    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        submit_type: "pay",
        customer_email: user.email,
        client_reference_id: order.id,
        line_items: lineItems,
        metadata: checkoutMetadata,
        payment_intent_data: {
          metadata: checkoutMetadata,
          shipping: {
            name: order.shippingFullName,
            address: {
              line1: order.shippingAddressLine1,
              line2: order.shippingAddressLine2 || undefined,
              city: order.shippingCity,
              state: order.shippingState,
              postal_code: order.shippingPostalCode,
              country: order.shippingCountry,
            },
          },
        },
        success_url: `${applicationOrigin}/orders?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${applicationOrigin}/orders?payment=cancelled&order_id=${order.id}`,
      },
      {
        idempotencyKey: `checkout-session:${order.id}`,
      }
    );

    if (!checkoutSession.url) {
      return Response.json(
        { error: "Stripe did not provide a checkout URL." },
        { status: 502 }
      );
    }

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentProvider: PaymentProvider.STRIPE,
        stripeCheckoutSessionId: checkoutSession.id,
      },
    });

    return Response.json(
      {
        checkoutUrl: checkoutSession.url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to start Stripe Checkout." },
      { status: 500 }
    );
  }
}
