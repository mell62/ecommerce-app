import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to view your wishlist." },
        { status: 401 }
      );
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        items: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
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

    return Response.json({
      items: wishlist?.items.map((item) => item.product) ?? [],
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to load wishlist." },
      { status: 500 }
    );
  }
}
