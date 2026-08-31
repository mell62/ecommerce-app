import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_REVIEW_LENGTH } from "@/lib/review-validation";
import { DELETE, PATCH, POST } from "./route";

const reviewCreateMock = vi.hoisted(() => vi.fn());
const reviewDeleteMock = vi.hoisted(() => vi.fn());
const reviewFindUniqueMock = vi.hoisted(() => vi.fn());
const reviewUpdateMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    review: {
      create: reviewCreateMock,
      delete: reviewDeleteMock,
      findUnique: reviewFindUniqueMock,
      update: reviewUpdateMock,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

const currentUser = {
  id: "customer-1",
  name: "Alex",
};

function createRequest(method: string, body: unknown): Request {
  return new Request("http://localhost/api/reviews", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("reviews API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(currentUser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects malformed JSON without calling the database", async () => {
    const request = new Request("http://localhost/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Missing required review fields",
    });
    expect(reviewCreateMock).not.toHaveBeenCalled();
  });

  it("requires authentication before creating a review", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await POST(
      createRequest("POST", {
        productId: "product-1",
        rating: 5,
        comment: "Excellent mouse.",
      })
    );

    expect(response.status).toBe(401);
    expect(reviewCreateMock).not.toHaveBeenCalled();
  });

  it.each([0, 6, 2.5])("rejects an invalid rating of %s", async (rating) => {
    const response = await POST(
      createRequest("POST", {
        productId: "product-1",
        rating,
        comment: "Useful feedback.",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Rating must be between 1 and 5",
    });
    expect(reviewCreateMock).not.toHaveBeenCalled();
  });

  it("rejects comments over the maximum length", async () => {
    const response = await POST(
      createRequest("POST", {
        productId: "product-1",
        rating: 5,
        comment: "a".repeat(MAX_REVIEW_LENGTH + 1),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: `Review must be ${MAX_REVIEW_LENGTH} characters or fewer.`,
    });
    expect(reviewCreateMock).not.toHaveBeenCalled();
  });

  it("creates a valid review using trimmed server-side values", async () => {
    const createdReview = {
      id: "review-1",
      productId: "product-1",
      userId: currentUser.id,
      name: currentUser.name,
      rating: 5,
      comment: "Excellent mouse.",
    };
    reviewCreateMock.mockResolvedValue(createdReview);

    const response = await POST(
      createRequest("POST", {
        productId: "  product-1  ",
        rating: "5",
        comment: "  Excellent mouse.  ",
      })
    );

    expect(response.status).toBe(201);
    expect(reviewCreateMock).toHaveBeenCalledWith({
      data: {
        productId: "product-1",
        userId: currentUser.id,
        name: currentUser.name,
        rating: 5,
        comment: "Excellent mouse.",
      },
    });
    expect(await response.json()).toEqual(createdReview);
  });

  it("returns a conflict when the database rejects a duplicate review", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    reviewCreateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    const response = await POST(
      createRequest("POST", {
        productId: "product-1",
        rating: 5,
        comment: "A second review.",
      })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "You have already reviewed this product.",
    });
  });

  it("prevents a user from editing another customer's review", async () => {
    reviewFindUniqueMock.mockResolvedValue({
      id: "review-1",
      userId: "customer-2",
    });

    const response = await PATCH(
      createRequest("PATCH", {
        reviewId: "review-1",
        rating: 4,
        comment: "Updated feedback.",
      })
    );

    expect(response.status).toBe(403);
    expect(reviewUpdateMock).not.toHaveBeenCalled();
  });

  it("updates a review owned by the current user", async () => {
    const updatedReview = {
      id: "review-1",
      userId: currentUser.id,
      rating: 4,
      comment: "Updated feedback.",
    };
    reviewFindUniqueMock.mockResolvedValue({
      id: "review-1",
      userId: currentUser.id,
    });
    reviewUpdateMock.mockResolvedValue(updatedReview);

    const response = await PATCH(
      createRequest("PATCH", {
        reviewId: "  review-1  ",
        rating: "4",
        comment: "  Updated feedback.  ",
      })
    );

    expect(response.status).toBe(200);
    expect(reviewUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "review-1",
      },
      data: {
        rating: 4,
        comment: "Updated feedback.",
      },
    });
  });

  it("prevents a user from deleting another customer's review", async () => {
    reviewFindUniqueMock.mockResolvedValue({
      id: "review-1",
      userId: "customer-2",
    });

    const response = await DELETE(
      createRequest("DELETE", {
        reviewId: "review-1",
      })
    );

    expect(response.status).toBe(403);
    expect(reviewDeleteMock).not.toHaveBeenCalled();
  });

  it("deletes a review owned by the current user", async () => {
    reviewFindUniqueMock.mockResolvedValue({
      id: "review-1",
      userId: currentUser.id,
    });
    reviewDeleteMock.mockResolvedValue({ id: "review-1" });

    const response = await DELETE(
      createRequest("DELETE", {
        reviewId: "review-1",
      })
    );

    expect(response.status).toBe(200);
    expect(reviewDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "review-1",
      },
    });
  });
});
