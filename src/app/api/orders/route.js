import { prisma } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();

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
