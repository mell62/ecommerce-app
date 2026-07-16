import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();

    const comment = body.comment?.trim();
    const rating = Number(body.rating);

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to submit a review." },
        { status: 401 }
      );
    }

    if (!body.productId || !rating || !comment) {
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
        userId: user.id,
        name: user.name,
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
