import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();

    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        totalPrice: body.totalPrice,
        userId: body.userId,
      },
    });

    return Response.json(order);
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
