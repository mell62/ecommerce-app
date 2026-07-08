import { prisma } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const comment = body.comment?.trim();
    const rating = Number(body.rating);

    if (!body.productId || !name || !rating || !comment) {
      return Response.json(
        { error: "Missing required review fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return Response.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId: body.productId,
        name,
        rating,
        comment,
      },
    });

    return Response.json(review, { status: 201 });
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Failed to create review" }, { status: 500 });
  }
}
