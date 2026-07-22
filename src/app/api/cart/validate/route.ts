import type { Product } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDiscountedPrice } from "@/lib/pricing";

type CartRequestItem = {
  id: string;
  quantity: number;
};

type ValidatedCartItem = Product & {
  originalPrice: number;
  quantity: number;
};

function isCartRequestItem(value: unknown): value is CartRequestItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    "quantity" in value &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("items" in body) ||
      !Array.isArray(body.items)
    ) {
      return Response.json(
        { error: "Cart items must be an array." },
        { status: 400 }
      );
    }

    const validatedItems: ValidatedCartItem[] = [];

    for (const item of body.items) {
      if (!isCartRequestItem(item)) {
        continue;
      }

      const product = await prisma.product.findUnique({
        where: {
          id: item.id,
        },
      });

      if (!product) {
        continue;
      }

      const finalPrice = getDiscountedPrice(
        product.price,
        product.discountPercent
      );

      validatedItems.push({
        ...product,
        price: finalPrice,
        originalPrice: product.price,
        quantity: item.quantity,
      });
    }

    return Response.json(validatedItems);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to validate cart." },
      { status: 500 }
    );
  }
}
