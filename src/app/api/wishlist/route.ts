import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

type WishlistRequestBody = {
  productId?: unknown;
};

async function getWishlistRequestBody(
  request: Request
): Promise<WishlistRequestBody | null> {
  try {
    const body: unknown = await request.json();

    return typeof body === "object" && body !== null ? body : null;
  } catch {
    return null;
  }
}

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

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to add products to your wishlist." },
        { status: 401 }
      );
    }

    const body = await getWishlistRequestBody(request);
    const productId =
      body && typeof body.productId === "string" ? body.productId.trim() : "";

    if (!productId) {
      return Response.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const productExists = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

    if (!productExists) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    const wishlist = await prisma.wishlist.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
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
    });

    return Response.json(
      {
        message: "Product added to wishlist.",
        item: wishlistItem.product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "This product is already in your wishlist." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to add product to wishlist." },
      { status: 500 }
    );
  }
}
