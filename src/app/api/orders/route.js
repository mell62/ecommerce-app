import { prisma } from "@/lib/db";

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
    }

    console.log(body);

    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        totalPrice: body.totalPrice,
        userId: body.userId,

        items: {
          create: body.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },

      include: {
        items: true,
      },
    });

    return Response.json(order);
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
