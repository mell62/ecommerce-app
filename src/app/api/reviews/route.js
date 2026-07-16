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

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to delete a review." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.reviewId) {
      return Response.json(
        { error: "Review ID is required." },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: {
        id: body.reviewId,
      },
    });

    if (!review) {
      return Response.json({ error: "Review not found." }, { status: 404 });
    }

    if (review.userId !== user.id) {
      return Response.json(
        { error: "You can only delete your own reviews." },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: {
        id: review.id,
      },
    });

    return Response.json({
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to delete review." },
      { status: 500 }
    );
  }
}
