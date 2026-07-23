import { prisma } from "@/lib/db";
import { getDiscountedPrice } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/session";

type OrderRequestItem = {
  id: string;
  quantity: number;
};

type ValidatedOrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

function isOrderRequestItem(value: unknown): value is OrderRequestItem {
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

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to place an order." },
        { status: 401 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("items" in body) ||
      !Array.isArray(body.items)
    ) {
      return Response.json(
        { error: "Order items are required." },
        { status: 400 }
      );
    }

    if (body.items.length === 0) {
      return Response.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const validatedItems: ValidatedOrderItem[] = [];

    for (const item of body.items) {
      if (!isOrderRequestItem(item)) {
        return Response.json(
          { error: "Each order item needs a valid product ID and quantity." },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({
        where: {
          id: item.id,
        },
      });

      if (!product) {
        return Response.json(
          { error: `Product not found: ${item.id}` },
          { status: 404 }
        );
      }

      if (product.stockCount < item.quantity) {
        return Response.json(
          {
            error: `${product.name} does not have enough stock available.`,
          },
          { status: 400 }
        );
      }

      const finalPrice = getDiscountedPrice(
        product.price,
        product.discountPercent
      );

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: finalPrice,
      });
    }

    const validatedTotalPrice = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          status: "PENDING",
          totalPrice: validatedTotalPrice,
          userId: user.id,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
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

      for (const item of validatedItems) {
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stockCount: {
              decrement: item.quantity,
            },
          },
        });
      }

      return createdOrder;
    });

    return Response.json(order);
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
