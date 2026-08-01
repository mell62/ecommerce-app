import { prisma } from "@/lib/db";
import { getDiscountedPrice } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/session";

export async function GET(): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to view your cart." },
        { status: 401 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        items: {
          orderBy: {
            id: "asc",
          },
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                stockCount: true,
                discountPercent: true,
              },
            },
          },
        },
      },
    });

    const items =
      cart?.items.map(({ product, quantity }) => ({
        ...product,
        originalPrice: product.price,
        price: getDiscountedPrice(product.price, product.discountPercent),
        quantity,
      })) ?? [];

    return Response.json({ items });
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Failed to load cart." }, { status: 500 });
  }
}
