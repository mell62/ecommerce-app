import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createReviewSourceHash,
  getProductReviewSummary,
  ReviewSummaryProductNotFoundError,
  selectRepresentativeReviews,
} from "@/lib/review-summary-cache";

vi.mock("server-only", () => ({}));

const productFindUniqueMock = vi.hoisted(() => vi.fn());
const summaryUpsertMock = vi.hoisted(() => vi.fn());
const summarizeProductReviewsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findUnique: productFindUniqueMock,
    },
    productReviewSummary: {
      upsert: summaryUpsertMock,
    },
  },
}));

vi.mock("@/lib/review-summary", () => ({
  MIN_REVIEWS_FOR_SUMMARY: 2,
  getReviewSummaryModel: () => "deepseek-v4-flash",
  summarizeProductReviews: summarizeProductReviewsMock,
}));

const reviews = [
  { id: "review-2", rating: 4, comment: "Comfortable for work." },
  { id: "review-1", rating: 5, comment: "Accurate and responsive." },
];

describe("review summary cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the same source hash regardless of review order", () => {
    expect(createReviewSourceHash(reviews)).toBe(
      createReviewSourceHash([...reviews].reverse())
    );
    expect(
      createReviewSourceHash([
        { ...reviews[0], comment: "The edited review." },
        reviews[1],
      ])
    ).not.toBe(createReviewSourceHash(reviews));
  });

  it("samples a maximum of 50 reviews across the supplied collection", () => {
    const manyReviews = Array.from({ length: 100 }, (_, index) => ({
      id: `review-${index}`,
      rating: (index % 5) + 1,
      comment: `Review ${index}`,
    }));

    const sample = selectRepresentativeReviews(manyReviews);

    expect(sample).toHaveLength(50);
    expect(sample[0].comment).toBe("Review 0");
    expect(sample[49].comment).toBe("Review 99");
  });

  it("returns an unchanged cached summary without calling DeepSeek", async () => {
    const sourceHash = createReviewSourceHash(reviews);
    const generatedAt = new Date("2026-09-11T12:00:00.000Z");
    productFindUniqueMock.mockResolvedValue({
      name: "Zeus Wireless Mouse",
      reviews,
      reviewSummary: {
        content: "Customers consistently praise its accuracy and comfort.",
        sourceHash,
        reviewCount: reviews.length,
        model: "deepseek-v4-flash",
        generatedAt,
      },
    });

    await expect(getProductReviewSummary("product-1")).resolves.toEqual({
      status: "ready",
      content: "Customers consistently praise its accuracy and comfort.",
      reviewCount: 2,
      generatedAt,
      cached: true,
    });
    expect(summarizeProductReviewsMock).not.toHaveBeenCalled();
    expect(summaryUpsertMock).not.toHaveBeenCalled();
  });

  it("generates and stores a summary when the cache is stale", async () => {
    const generatedAt = new Date("2026-09-11T13:00:00.000Z");
    productFindUniqueMock.mockResolvedValue({
      name: "Zeus Wireless Mouse",
      reviews,
      reviewSummary: {
        content: "An outdated summary.",
        sourceHash: "outdated-hash",
        reviewCount: 2,
        model: "deepseek-v4-flash",
        generatedAt: new Date("2026-09-10T12:00:00.000Z"),
      },
    });
    summarizeProductReviewsMock.mockResolvedValue(
      "Customers praise its accuracy and comfort."
    );
    summaryUpsertMock.mockResolvedValue({
      content: "Customers praise its accuracy and comfort.",
      reviewCount: 2,
      generatedAt,
    });

    await expect(getProductReviewSummary("product-1")).resolves.toEqual({
      status: "ready",
      content: "Customers praise its accuracy and comfort.",
      reviewCount: 2,
      generatedAt,
      cached: false,
    });
    expect(summarizeProductReviewsMock).toHaveBeenCalledWith(
      "Zeus Wireless Mouse",
      reviews.map(({ rating, comment }) => ({ rating, comment }))
    );
    expect(summaryUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "product-1" },
        create: expect.objectContaining({
          productId: "product-1",
          reviewCount: 2,
          model: "deepseek-v4-flash",
        }),
        update: expect.objectContaining({
          reviewCount: 2,
          model: "deepseek-v4-flash",
        }),
      })
    );
  });

  it("does not call DeepSeek without enough reviews", async () => {
    productFindUniqueMock.mockResolvedValue({
      name: "Zeus Wireless Mouse",
      reviews: reviews.slice(0, 1),
      reviewSummary: null,
    });

    await expect(getProductReviewSummary("product-1")).resolves.toEqual({
      status: "not-enough-reviews",
      reviewCount: 1,
    });
    expect(summarizeProductReviewsMock).not.toHaveBeenCalled();
  });

  it("distinguishes a missing product from an empty review list", async () => {
    productFindUniqueMock.mockResolvedValue(null);

    await expect(getProductReviewSummary("missing-product")).rejects.toBeInstanceOf(
      ReviewSummaryProductNotFoundError
    );
  });
});
