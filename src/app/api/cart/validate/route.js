import { prisma } from "@/lib/db";
import { getDiscountedPrice } from "@/lib/pricing";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.items)) {
      return Response.json(
        { error: "Cart items must be an array." },
        { status: 400 }
      );
    }

    const validatedItems = [];

    for (const item of body.items) {
      if (!item.id || !Number.isInteger(item.quantity) || item.quantity < 1) {
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
