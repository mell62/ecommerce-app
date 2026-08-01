import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDiscountedPrice } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/session";

class StockConflictError extends Error {
  productName: string;

  constructor(productName: string) {
    super(`${productName} does not have enough stock available.`);
    this.name = "StockConflictError";
    this.productName = productName;
  }
}

export async function POST(): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to place an order." },
        { status: 401 }
      );
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const cart = await transaction.cart.findUnique({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            items: {
              select: {
                quantity: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    stockCount: true,
                    discountPercent: true,
                  },
                },
              },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          return { outcome: "empty-cart" } as const;
        }

        const unavailableItem = cart.items.find(
          (item) => item.quantity > item.product.stockCount
        );

        if (unavailableItem) {
          return {
            outcome: "insufficient-stock",
            productName: unavailableItem.product.name,
            stockCount: unavailableItem.product.stockCount,
          } as const;
        }

        const orderItems = cart.items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
          price: getDiscountedPrice(product.price, product.discountPercent),
        }));

        const totalPrice = orderItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );

        const order = await transaction.order.create({
          data: {
            status: "PENDING",
            totalPrice,
            userId: user.id,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        for (const item of orderItems) {
          const updateResult = await transaction.product.updateMany({
            where: {
              id: item.productId,
              stockCount: {
                gte: item.quantity,
              },
            },
            data: {
              stockCount: {
                decrement: item.quantity,
              },
            },
          });

          if (updateResult.count === 0) {
            const productName =
              cart.items.find(
                (cartItem) => cartItem.product.id === item.productId
              )?.product.name ?? "A product";

            throw new StockConflictError(productName);
          }
        }

        await transaction.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });

        return {
          outcome: "success",
          order,
        } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

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
