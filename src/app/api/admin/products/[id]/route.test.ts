// @vitest-environment node

import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "@/app/api/admin/products/[id]/route";

const getAdminAccessMock = vi.hoisted(() => vi.fn());
const productUpdateMock = vi.hoisted(() => vi.fn());
const productFindUniqueMock = vi.hoisted(() => vi.fn());
const productDeleteMock = vi.hoisted(() => vi.fn());
const orderItemCountMock = vi.hoisted(() => vi.fn());
const reviewDeleteManyMock = vi.hoisted(() => vi.fn());
const reviewSummaryDeleteManyMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const deleteManagedProductImageMock = vi.hoisted(() => vi.fn());
const getManagedProductImagePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  getAdminAccess: getAdminAccessMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      delete: productDeleteMock,
      findUnique: productFindUniqueMock,
      update: productUpdateMock,
    },
    orderItem: {
      count: orderItemCountMock,
    },
    review: {
      deleteMany: reviewDeleteManyMock,
    },
    productReviewSummary: {
      deleteMany: reviewSummaryDeleteManyMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/product-image-storage", () => ({
  deleteManagedProductImage: deleteManagedProductImageMock,
  getManagedProductImagePath: getManagedProductImagePathMock,
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

const transactionClient = {
  product: {
    delete: productDeleteMock,
    findUnique: productFindUniqueMock,
    update: productUpdateMock,
  },
  orderItem: {
    count: orderItemCountMock,
  },
  review: {
    deleteMany: reviewDeleteManyMock,
  },
  productReviewSummary: {
    deleteMany: reviewSummaryDeleteManyMock,
  },
};

describe("admin product API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccessMock.mockResolvedValue({
      status: "authorized",
      user: admin,
    });
    transactionMock.mockImplementation(async (operation: unknown) => {
      if (typeof operation === "function") {
        return operation(transactionClient);
      }

      return Promise.all(operation as unknown[]);
    });
    reviewSummaryDeleteManyMock.mockResolvedValue({ count: 1 });
    productFindUniqueMock.mockResolvedValue({
      imageUrl: validProduct.imageUrl,
    });
    deleteManagedProductImageMock.mockResolvedValue(true);
    getManagedProductImagePathMock.mockImplementation((imageUrl: string) => {
      const marker = "/product-images/";
      const markerIndex = imageUrl.indexOf(marker);

      return markerIndex >= 0
        ? imageUrl.slice(markerIndex + marker.length).split("?")[0]
        : null;
    });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
    expect(productFindUniqueMock).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      select: {
        imageUrl: true,
      },
    });
    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function));
    expect(deleteManagedProductImageMock).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      product: {
        ...updatedProduct,
        createdAt: updatedProduct.createdAt.toISOString(),
      },
    });
  });

  it("deletes the previous managed image after replacing it", async () => {
    const previousImageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/123e4567-e89b-12d3-a456-426614174000.webp";
    const replacementImageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/223e4567-e89b-12d3-a456-426614174000.webp";
    productFindUniqueMock.mockResolvedValue({ imageUrl: previousImageUrl });
    productUpdateMock.mockResolvedValue({
      id: "product-1",
      ...validProduct,
      imageUrl: replacementImageUrl,
      createdAt: new Date("2026-09-01T10:00:00.000Z"),
    });

    const response = await PATCH(
      createRequest({ ...validProduct, imageUrl: replacementImageUrl }),
      context
    );

    expect(response.status).toBe(200);
    expect(deleteManagedProductImageMock).toHaveBeenCalledWith(
      previousImageUrl
    );
  });

  it("preserves a successful edit when previous image cleanup fails", async () => {
    const previousImageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/123e4567-e89b-12d3-a456-426614174000.png";
    productFindUniqueMock.mockResolvedValue({ imageUrl: previousImageUrl });
    productUpdateMock.mockResolvedValue({
      id: "product-1",
      ...validProduct,
      createdAt: new Date("2026-09-01T10:00:00.000Z"),
    });
    deleteManagedProductImageMock.mockRejectedValue(
      new Error("Storage unavailable")
    );

    const response = await PATCH(createRequest(validProduct), context);

    expect(response.status).toBe(200);
    expect(deleteManagedProductImageMock).toHaveBeenCalledWith(
      previousImageUrl
    );
  });

  it("keeps a managed image when only its URL query changes", async () => {
    const previousImageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/123e4567-e89b-12d3-a456-426614174000.webp";
    const imageUrlWithQuery = `${previousImageUrl}?width=1200`;
    productFindUniqueMock.mockResolvedValue({ imageUrl: previousImageUrl });
    productUpdateMock.mockResolvedValue({
      id: "product-1",
      ...validProduct,
      imageUrl: imageUrlWithQuery,
      createdAt: new Date("2026-09-01T10:00:00.000Z"),
    });

    const response = await PATCH(
      createRequest({ ...validProduct, imageUrl: imageUrlWithQuery }),
      context
    );

    expect(response.status).toBe(200);
    expect(deleteManagedProductImageMock).not.toHaveBeenCalled();
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

  it("returns a retryable response when editing loses its database connection", async () => {
    productFindUniqueMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Database unavailable", {
        code: "P1001",
        clientVersion: "test",
      })
    );

    const response = await PATCH(createRequest(validProduct), context);

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    expect(await response.json()).toEqual({
      error: "The database is temporarily unavailable. Try again shortly.",
    });
  });

  it("prevents a non-admin user from deleting a product", async () => {
    getAdminAccessMock.mockResolvedValue({
      status: "forbidden",
      user: { ...admin, role: "USER" },
    });

    const response = await DELETE(createRequest(null), context);

    expect(response.status).toBe(403);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns not found when deleting an unknown product", async () => {
    productFindUniqueMock.mockResolvedValue(null);

    const response = await DELETE(createRequest(null), context);

    expect(response.status).toBe(404);
    expect(orderItemCountMock).not.toHaveBeenCalled();
    expect(productDeleteMock).not.toHaveBeenCalled();
  });

  it("preserves a product that appears in customer order history", async () => {
    productFindUniqueMock.mockResolvedValue({
      id: "product-1",
      name: "Gaming Mouse",
      imageUrl:
        "https://project.supabase.co/storage/v1/object/public/product-images/products/123e4567-e89b-12d3-a456-426614174000.webp",
    });
    orderItemCountMock.mockResolvedValue(2);

    const response = await DELETE(createRequest(null), context);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error:
        "Products included in customer orders cannot be deleted because their order history must be preserved.",
    });
    expect(reviewDeleteManyMock).not.toHaveBeenCalled();
    expect(productDeleteMock).not.toHaveBeenCalled();
    expect(deleteManagedProductImageMock).not.toHaveBeenCalled();
  });

  it("deletes an unordered product, its reviews, and its managed image", async () => {
    const imageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/123e4567-e89b-12d3-a456-426614174000.webp";
    productFindUniqueMock.mockResolvedValue({
      id: "product-1",
      name: "Gaming Mouse",
      imageUrl,
    });
    orderItemCountMock.mockResolvedValue(0);
    reviewDeleteManyMock.mockResolvedValue({ count: 3 });
    productDeleteMock.mockResolvedValue({ id: "product-1" });

    const response = await DELETE(createRequest(null), context);

    expect(response.status).toBe(200);
    expect(reviewDeleteManyMock).toHaveBeenCalledWith({
      where: {
        productId: "product-1",
      },
    });
    expect(productDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
    });
    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(productFindUniqueMock).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });
    expect(deleteManagedProductImageMock).toHaveBeenCalledWith(imageUrl);
    expect(await response.json()).toEqual({
      message: "Gaming Mouse was deleted successfully.",
      productId: "product-1",
    });
  });

  it("does not attempt storage cleanup for an external product image", async () => {
    productFindUniqueMock.mockResolvedValue({
      id: "product-1",
      name: "Gaming Mouse",
      imageUrl: "https://images.unsplash.com/photo-123",
    });
    orderItemCountMock.mockResolvedValue(0);
    reviewDeleteManyMock.mockResolvedValue({ count: 0 });
    productDeleteMock.mockResolvedValue({ id: "product-1" });

    const response = await DELETE(createRequest(null), context);

    expect(response.status).toBe(200);
    expect(deleteManagedProductImageMock).not.toHaveBeenCalled();
  });

  it("preserves a successful deletion when managed image cleanup fails", async () => {
    const imageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/123e4567-e89b-12d3-a456-426614174000.webp";
    productFindUniqueMock.mockResolvedValue({
      id: "product-1",
      name: "Gaming Mouse",
      imageUrl,
    });
    orderItemCountMock.mockResolvedValue(0);
    reviewDeleteManyMock.mockResolvedValue({ count: 0 });
    productDeleteMock.mockResolvedValue({ id: "product-1" });
    deleteManagedProductImageMock.mockRejectedValue(
      new Error("Storage unavailable")
    );

    const response = await DELETE(createRequest(null), context);

    expect(response.status).toBe(200);
    expect(deleteManagedProductImageMock).toHaveBeenCalledWith(imageUrl);
    expect(await response.json()).toEqual({
      message: "Gaming Mouse was deleted successfully.",
      productId: "product-1",
    });
  });

  it("returns a retryable response when deletion loses its database connection", async () => {
    productFindUniqueMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Database unavailable", {
        code: "P2024",
        clientVersion: "test",
      })
    );

    const response = await DELETE(createRequest(null), context);

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    expect(await response.json()).toEqual({
      error: "The database is temporarily unavailable. Try again shortly.",
    });
    expect(productDeleteMock).not.toHaveBeenCalled();
    expect(deleteManagedProductImageMock).not.toHaveBeenCalled();
  });
});
