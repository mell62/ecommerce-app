import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { MAX_REVIEW_LENGTH } from "@/lib/review-validation";

type ReviewRequestBody = {
  productId?: unknown;
  reviewId?: unknown;
  rating?: unknown;
  comment?: unknown;
};

function isReviewRequestBody(value: unknown): value is ReviewRequestBody {
  return typeof value === "object" && value !== null;
}

async function getReviewRequestBody(
  request: Request
): Promise<ReviewRequestBody | null> {
  try {
    const body: unknown = await request.json();

    return isReviewRequestBody(body) ? body : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await getReviewRequestBody(request);

    if (!body) {
      return Response.json(
        { error: "Missing required review fields" },
        { status: 400 }
      );
    }

    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const rating =
      typeof body.rating === "string" || typeof body.rating === "number"
        ? Number(body.rating)
        : Number.NaN;

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to submit a review." },
        { status: 401 }
      );
    }

    if (!productId || !comment || !Number.isFinite(rating)) {
      return Response.json(
        { error: "Missing required review fields" },
        { status: 400 }
      );
    }

    if (comment.length > MAX_REVIEW_LENGTH) {
      return Response.json(
        { error: `Review must be ${MAX_REVIEW_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        name: user.name,
        rating,
        comment,
      },
    });

    return Response.json(review, { status: 201 });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "You have already reviewed this product." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to create review." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to delete a review." },
        { status: 401 }
      );
    }

    const body = await getReviewRequestBody(request);

    if (!body || typeof body.reviewId !== "string" || !body.reviewId) {
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

export async function PATCH(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to edit a review." },
        { status: 401 }
      );
    }

    const body = await getReviewRequestBody(request);

    if (!body) {
      return Response.json(
        { error: "Review ID, rating, and comment are required." },
        { status: 400 }
      );
    }

    const reviewId =
      typeof body.reviewId === "string" ? body.reviewId.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const rating =
      typeof body.rating === "string" || typeof body.rating === "number"
        ? Number(body.rating)
        : Number.NaN;

    if (!reviewId || !comment || !Number.isFinite(rating)) {
      return Response.json(
        { error: "Review ID, rating, and comment are required." },
        { status: 400 }
      );
    }

    if (comment.length > MAX_REVIEW_LENGTH) {
      return Response.json(
        { error: `Review must be ${MAX_REVIEW_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json(
        { error: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!review) {
      return Response.json({ error: "Review not found." }, { status: 404 });
    }

    if (review.userId !== user.id) {
      return Response.json(
        { error: "You can only edit your own reviews." },
        { status: 403 }
      );
    }

    const updatedReview = await prisma.review.update({
      where: {
        id: review.id,
      },
      data: {
        rating,
        comment,
      },
    });

    return Response.json({
      message: "Review updated successfully.",
      review: updatedReview,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to update review." },
      { status: 500 }
    );
  }
}
