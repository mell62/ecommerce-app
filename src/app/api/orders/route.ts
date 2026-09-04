import { Prisma } from "@prisma/client";
import {
  createOrderFromCart,
  StockConflictError,
} from "@/lib/order-service";
import { getCurrentUser } from "@/lib/session";
import { validateShippingAddress } from "@/lib/shipping-address";

async function getRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getShippingAddress(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return "shippingAddress" in value ? value.shippingAddress : undefined;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to place an order." },
        { status: 401 }
      );
    }

    const body = await getRequestBody(request);
    const addressResult = validateShippingAddress(getShippingAddress(body));

    if (!addressResult.success) {
      return Response.json(
        {
          error: "Enter a valid shipping address.",
          fieldErrors: addressResult.errors,
        },
        { status: 400 }
      );
    }

    const result = await createOrderFromCart(user.id, addressResult.data);

    if (result.outcome === "empty-cart") {
      return Response.json({ error: "Your cart is empty." }, { status: 400 });
    }

    if (result.outcome === "insufficient-stock") {
      return Response.json(
        {
          error:
            result.stockCount === 0
              ? `${result.productName} is out of stock.`
              : `${result.productName} only has ${result.stockCount} available.`,
        },
        { status: 409 }
      );
    }

    return Response.json(result.order, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error instanceof StockConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return Response.json(
        { error: "Stock changed during checkout. Please try again." },
        { status: 409 }
      );
    }

    return Response.json({ error: "Failed to create order." }, { status: 500 });
  }
}
