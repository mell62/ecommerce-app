import { prisma } from "@/lib/db";
import { getDiscountedPrice } from "@/lib/pricing";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.userId || !body.totalPrice || !Array.isArray(body.items)) {
      return Response.json({ error: "Invalid order data" }, { status: 400 });
    }

    if (body.items.length === 0) {
      return Response.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const validatedItems = [];

    for (const item of body.items) {
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

    console.log(body);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          status: "PENDING",
          totalPrice: body.totalPrice,
          userId: body.userId,
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
