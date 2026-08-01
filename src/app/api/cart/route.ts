import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDiscountedPrice } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/session";

type CartRequestBody = {
  productId?: unknown;
  quantity?: unknown;
};

async function getCartRequestBody(
  request: Request
): Promise<CartRequestBody | null> {
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

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to add products to your cart." },
        { status: 401 }
      );
    }

    const body = await getCartRequestBody(request);
    const productId =
      body && typeof body.productId === "string" ? body.productId.trim() : "";
    const quantity = body?.quantity;

    if (!productId) {
      return Response.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return Response.json(
        { error: "Quantity must be a positive whole number." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const product = await transaction.product.findUnique({
          where: {
            id: productId,
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            stockCount: true,
            discountPercent: true,
          },
        });

        if (!product) {
          return { outcome: "not-found" } as const;
        }

        const cart = await transaction.cart.upsert({
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

        const existingItem = await transaction.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId,
            },
          },
          select: {
            quantity: true,
          },
        });

        const updatedQuantity = (existingItem?.quantity ?? 0) + quantity;

        if (updatedQuantity > product.stockCount) {
          return {
            outcome: "insufficient-stock",
            stockCount: product.stockCount,
          } as const;
        }

        const item = await transaction.cartItem.upsert({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId,
            },
          },
          update: {
            quantity: updatedQuantity,
          },
          create: {
            cartId: cart.id,
            productId,
            quantity,
          },
          select: {
            quantity: true,
          },
        });

        return {
          outcome: "success",
          item: {
            ...product,
            originalPrice: product.price,
            price: getDiscountedPrice(product.price, product.discountPercent),
            quantity: item.quantity,
          },
          wasCreated: !existingItem,
        } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    if (result.outcome === "not-found") {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    if (result.outcome === "insufficient-stock") {
      return Response.json(
        {
          error:
            result.stockCount === 0
              ? "This product is out of stock."
              : `Only ${result.stockCount} available.`,
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        message: result.wasCreated
          ? "Product added to cart."
          : "Cart quantity updated.",
        item: result.item,
      },
      { status: result.wasCreated ? 201 : 200 }
    );
  } catch (error) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return Response.json(
        { error: "Your cart changed during this request. Please try again." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to add product to cart." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to update your cart." },
        { status: 401 }
      );
    }

    const body = await getCartRequestBody(request);
    const productId =
      body && typeof body.productId === "string" ? body.productId.trim() : "";
    const quantity = body?.quantity;

    if (!productId) {
      return Response.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return Response.json(
        { error: "Quantity must be a positive whole number." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const existingItem = await transaction.cartItem.findFirst({
          where: {
            productId,
            cart: {
              userId: user.id,
            },
          },
          select: {
            id: true,
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

        if (!existingItem) {
          return { outcome: "not-found" } as const;
        }

        if (quantity > existingItem.product.stockCount) {
          return {
            outcome: "insufficient-stock",
            stockCount: existingItem.product.stockCount,
          } as const;
        }

        const updatedItem = await transaction.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity,
          },
          select: {
            quantity: true,
          },
        });

        return {
          outcome: "success",
          item: {
            ...existingItem.product,
            originalPrice: existingItem.product.price,
            price: getDiscountedPrice(
              existingItem.product.price,
              existingItem.product.discountPercent
            ),
            quantity: updatedItem.quantity,
          },
        } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    if (result.outcome === "not-found") {
      return Response.json(
        { error: "Product is not in your cart." },
        { status: 404 }
      );
    }

    if (result.outcome === "insufficient-stock") {
      return Response.json(
        {
          error:
            result.stockCount === 0
              ? "This product is out of stock."
              : `Only ${result.stockCount} available.`,
        },
        { status: 409 }
      );
    }

    return Response.json({
      message: "Cart quantity updated.",
      item: result.item,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return Response.json(
        { error: "Your cart changed during this request. Please try again." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to update cart quantity." },
      { status: 500 }
    );
  }
}
