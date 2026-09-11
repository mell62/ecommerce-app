import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  getReviewSummaryModel,
  MIN_REVIEWS_FOR_SUMMARY,
  summarizeProductReviews,
  type ReviewForSummary,
} from "@/lib/review-summary";

const MAX_REVIEWS_IN_AI_REQUEST = 50;

type StoredReview = Readonly<{
  id: string;
  rating: number;
  comment: string;
}>;

export type ProductReviewSummaryResult =
  | Readonly<{
      status: "not-enough-reviews";
      reviewCount: number;
    }>
  | Readonly<{
      status: "ready";
      content: string;
      reviewCount: number;
      generatedAt: Date;
      cached: boolean;
    }>;

export class ReviewSummaryProductNotFoundError extends Error {
  constructor() {
    super("Product not found.");
    this.name = "ReviewSummaryProductNotFoundError";
  }
}

export function createReviewSourceHash(
  reviews: readonly StoredReview[]
): string {
  const stableReviews = [...reviews]
    .sort((first, second) => first.id.localeCompare(second.id))
    .map(({ id, rating, comment }) => ({ id, rating, comment }));

  return createHash("sha256")
    .update(JSON.stringify(stableReviews))
    .digest("hex");
}

export function selectRepresentativeReviews(
  reviews: readonly StoredReview[]
): ReviewForSummary[] {
  if (reviews.length <= MAX_REVIEWS_IN_AI_REQUEST) {
    return reviews.map(({ rating, comment }) => ({ rating, comment }));
  }

  return Array.from({ length: MAX_REVIEWS_IN_AI_REQUEST }, (_, index) => {
    const sourceIndex = Math.round(
      (index * (reviews.length - 1)) / (MAX_REVIEWS_IN_AI_REQUEST - 1)
    );
    const review = reviews[sourceIndex];

    return {
      rating: review.rating,
      comment: review.comment,
    };
  });
}

export async function getProductReviewSummary(
  productId: string
): Promise<ProductReviewSummaryResult> {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      name: true,
      reviews: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          rating: true,
          comment: true,
        },
      },
      reviewSummary: {
        select: {
          content: true,
          sourceHash: true,
          reviewCount: true,
          model: true,
          generatedAt: true,
        },
      },
    },
  });

  if (!product) {
    throw new ReviewSummaryProductNotFoundError();
  }

  const reviewCount = product.reviews.length;

  if (reviewCount < MIN_REVIEWS_FOR_SUMMARY) {
    return {
      status: "not-enough-reviews",
      reviewCount,
    };
  }

  const sourceHash = createReviewSourceHash(product.reviews);
  const model = getReviewSummaryModel();
  const cachedSummary = product.reviewSummary;

  if (
    cachedSummary?.sourceHash === sourceHash &&
    cachedSummary.reviewCount === reviewCount &&
    cachedSummary.model === model
  ) {
    return {
      status: "ready",
      content: cachedSummary.content,
      reviewCount,
      generatedAt: cachedSummary.generatedAt,
      cached: true,
    };
  }

  const content = await summarizeProductReviews(
    product.name,
    selectRepresentativeReviews(product.reviews)
  );

  const savedSummary = await prisma.productReviewSummary.upsert({
    where: {
      productId,
    },
    create: {
      productId,
      content,
      sourceHash,
      reviewCount,
      model,
    },
    update: {
      content,
      sourceHash,
      reviewCount,
      model,
      generatedAt: new Date(),
    },
    select: {
      content: true,
      reviewCount: true,
      generatedAt: true,
    },
  });

  return {
    status: "ready",
    ...savedSummary,
    cached: false,
  };
}
