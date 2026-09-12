// @vitest-environment node

import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/admin/products/[id]/route";

const getAdminAccessMock = vi.hoisted(() => vi.fn());
const productUpdateMock = vi.hoisted(() => vi.fn());
const reviewSummaryDeleteManyMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  getAdminAccess: getAdminAccessMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      update: productUpdateMock,
    },
    productReviewSummary: {
      deleteMany: reviewSummaryDeleteManyMock,
    },
    $transaction: transactionMock,
  },
}));

const admin = {
  id: "admin-1",
  name: "Mycroft",
  email: "mycroft@example.com",
  role: "ADMIN",
};

const validProduct = {
  name: "Wireless Headphones",
  description: "Comfortable headphones with active noise cancellation.",
  category: "Audio",
  imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
  price: 139.99,
  stockCount: 12,
  discountPercent: 15,
  isFeatured: true,
  isNew: false,
  isBestSeller: true,
};

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/products/product-1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const context = {
  params: Promise.resolve({ id: "product-1" }),
};

describe("admin product update API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccessMock.mockResolvedValue({
      status: "authorized",
      user: admin,
    });
    transactionMock.mockImplementation(async (operations: unknown[]) =>
      Promise.all(operations)
    );
    reviewSummaryDeleteManyMock.mockResolvedValue({ count: 1 });
  });

  it("requires a signed-in user", async () => {
    getAdminAccessMock.mockResolvedValue({ status: "unauthenticated" });

    const response = await PATCH(createRequest(validProduct), context);

    expect(response.status).toBe(401);
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects a signed-in non-admin user", async () => {
    getAdminAccessMock.mockResolvedValue({
      status: "forbidden",
      user: { ...admin, role: "USER" },
    });

    const response = await PATCH(createRequest(validProduct), context);

    expect(response.status).toBe(403);
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects invalid product values", async () => {
    const response = await PATCH(
      createRequest({ ...validProduct, stockCount: -1 }),
      context
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Enter valid product details.",
      fieldErrors: {
        stockCount: "Enter a whole-number stock count of zero or more.",
      },
    });
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON without updating the database", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/products/product-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      }),
      context
    );

    expect(response.status).toBe(400);
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it("requires a product ID", async () => {
    const response = await PATCH(createRequest(validProduct), {
      params: Promise.resolve({ id: " " }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Product ID is required.",
    });
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it("updates the product and invalidates its cached review summary", async () => {
    const updatedProduct = {
      id: "product-1",
      ...validProduct,
      createdAt: new Date("2026-09-01T10:00:00.000Z"),
    };
    productUpdateMock.mockResolvedValue(updatedProduct);

    const response = await PATCH(createRequest(validProduct), context);

    expect(response.status).toBe(200);
    expect(productUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      data: validProduct,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        imageUrl: true,
        price: true,
        stockCount: true,
        discountPercent: true,
        isFeatured: true,
        isNew: true,
        isBestSeller: true,
        createdAt: true,
      },
    });
    expect(reviewSummaryDeleteManyMock).toHaveBeenCalledWith({
      where: {
        productId: "product-1",
      },
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(await response.json()).toEqual({
      product: {
        ...updatedProduct,
        createdAt: updatedProduct.createdAt.toISOString(),
      },
    });
  });

  it("returns not found when the product no longer exists", async () => {
    productUpdateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "test",
      })
    );

    const response = await PATCH(createRequest(validProduct), context);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Product not found.",
    });
  });
});
