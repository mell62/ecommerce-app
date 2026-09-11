import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewSummaryProductNotFoundError } from "@/lib/review-summary-cache";
import { GET } from "./route";

const { getProductReviewSummaryMock, ProductNotFoundErrorMock } = vi.hoisted(
  () => ({
    getProductReviewSummaryMock: vi.fn(),
    ProductNotFoundErrorMock: class extends Error {},
  })
);

vi.mock("@/lib/review-summary-cache", () => ({
  getProductReviewSummary: getProductReviewSummaryMock,
  ReviewSummaryProductNotFoundError: ProductNotFoundErrorMock,
}));

function callGet(productId: string): Promise<Response> {
  return GET(
    new Request(
      `http://localhost:3000/api/products/${productId}/review-summary`
    ),
    {
      params: Promise.resolve({ id: productId }),
    }
  );
}

describe("product review summary API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a ready summary without exposing cache internals", async () => {
    const generatedAt = new Date("2026-09-12T10:00:00.000Z");
    getProductReviewSummaryMock.mockResolvedValue({
      status: "ready",
      content: "Customers praise its comfort and accurate tracking.",
      reviewCount: 12,
      generatedAt,
      cached: true,
    });

    const response = await callGet("product-1");

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      status: "ready",
      summary: "Customers praise its comfort and accurate tracking.",
      reviewCount: 12,
      generatedAt: generatedAt.toISOString(),
    });
    expect(getProductReviewSummaryMock).toHaveBeenCalledWith("product-1");
  });

  it("returns a normal state when there are not enough reviews", async () => {
    getProductReviewSummaryMock.mockResolvedValue({
      status: "not-enough-reviews",
      reviewCount: 1,
    });

    const response = await callGet("product-1");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "not-enough-reviews",
      reviewCount: 1,
    });
  });

  it("rejects an empty product ID", async () => {
    const response = await callGet(" ");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Product ID is required." });
    expect(getProductReviewSummaryMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the product does not exist", async () => {
    getProductReviewSummaryMock.mockRejectedValue(
      new ReviewSummaryProductNotFoundError()
    );

    const response = await callGet("missing-product");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Product not found." });
  });

  it("returns a safe temporary error when generation fails", async () => {
    const consoleErrorMock = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    getProductReviewSummaryMock.mockRejectedValue(
      new Error("DeepSeek request failed with status 429.")
    );

    const response = await callGet("product-1");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Review summary is temporarily unavailable.",
    });
    expect(consoleErrorMock).toHaveBeenCalledWith(
      "Failed to load product review summary:",
      expect.any(Error)
    );

    consoleErrorMock.mockRestore();
  });
});
