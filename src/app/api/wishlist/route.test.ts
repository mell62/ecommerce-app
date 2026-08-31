import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "./route";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const productFindUniqueMock = vi.hoisted(() => vi.fn());
const wishlistFindUniqueMock = vi.hoisted(() => vi.fn());
const wishlistUpsertMock = vi.hoisted(() => vi.fn());
const wishlistItemCreateMock = vi.hoisted(() => vi.fn());
const wishlistItemDeleteManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findUnique: productFindUniqueMock,
    },
    wishlist: {
      findUnique: wishlistFindUniqueMock,
      upsert: wishlistUpsertMock,
    },
    wishlistItem: {
      create: wishlistItemCreateMock,
      deleteMany: wishlistItemDeleteManyMock,
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

const product = {
  id: "product-1",
  name: "Zeus Wireless Mouse",
  description: "A precise wireless mouse.",
  price: 59.99,
  imageUrl: "/mouse.png",
  stockCount: 5,
  discountPercent: 15,
};

function createRequest(method: string, body: unknown): Request {
  return new Request("http://localhost/api/wishlist", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("wishlist API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(currentUser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires authentication before loading a wishlist", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(wishlistFindUniqueMock).not.toHaveBeenCalled();
  });

  it("loads only the authenticated user's wishlist", async () => {
    wishlistFindUniqueMock.mockResolvedValue({
      items: [{ product }],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(wishlistFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: currentUser.id,
        },
      })
    );
    expect(await response.json()).toEqual({ items: [product] });
  });

  it("rejects a missing product identifier", async () => {
    const response = await POST(createRequest("POST", { productId: "  " }));

    expect(response.status).toBe(400);
    expect(productFindUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects a product that does not exist", async () => {
    productFindUniqueMock.mockResolvedValue(null);

    const response = await POST(
      createRequest("POST", { productId: product.id })
    );

    expect(response.status).toBe(404);
    expect(wishlistUpsertMock).not.toHaveBeenCalled();
  });

  it("adds a product to the authenticated user's wishlist", async () => {
    productFindUniqueMock.mockResolvedValue({ id: product.id });
    wishlistUpsertMock.mockResolvedValue({ id: "wishlist-1" });
    wishlistItemCreateMock.mockResolvedValue({ product });

    const response = await POST(
      createRequest("POST", { productId: `  ${product.id}  ` })
    );

    expect(response.status).toBe(201);
    expect(wishlistUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: currentUser.id,
        },
        create: {
          userId: currentUser.id,
        },
      })
    );
    expect(wishlistItemCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          wishlistId: "wishlist-1",
          productId: product.id,
        },
      })
    );
    expect(await response.json()).toEqual({
      message: "Product added to wishlist.",
      item: product,
    });
  });

  it("returns a conflict for a duplicate wishlist product", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    productFindUniqueMock.mockResolvedValue({ id: product.id });
    wishlistUpsertMock.mockResolvedValue({ id: "wishlist-1" });
    wishlistItemCreateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    const response = await POST(
      createRequest("POST", { productId: product.id })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "This product is already in your wishlist.",
    });
  });

  it("scopes removal to the authenticated user's wishlist", async () => {
    wishlistItemDeleteManyMock.mockResolvedValue({ count: 1 });

    const response = await DELETE(
      createRequest("DELETE", { productId: product.id })
    );

    expect(response.status).toBe(200);
    expect(wishlistItemDeleteManyMock).toHaveBeenCalledWith({
      where: {
        productId: product.id,
        wishlist: {
          userId: currentUser.id,
        },
      },
    });
  });
});
