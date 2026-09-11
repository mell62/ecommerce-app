// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/products/route";

const getAdminAccessMock = vi.hoisted(() => vi.fn());
const productCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  getAdminAccess: getAdminAccessMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      create: productCreateMock,
    },
  },
}));

const admin = {
  id: "admin-1",
  name: "Mycroft",
  email: "mycroft@example.com",
  role: "ADMIN",
};

const validProduct = {
  name: "  Wireless Headphones  ",
  description: "  Comfortable headphones with active noise cancellation.  ",
  category: "  Audio  ",
  imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
  price: 149.99,
  stockCount: 18,
  discountPercent: 10,
  isFeatured: true,
  isNew: true,
  isBestSeller: false,
};

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("admin products API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccessMock.mockResolvedValue({
      status: "authorized",
      user: admin,
    });
  });

  it("requires a signed-in user", async () => {
    getAdminAccessMock.mockResolvedValue({ status: "unauthenticated" });

    const response = await POST(createRequest(validProduct));

    expect(response.status).toBe(401);
    expect(productCreateMock).not.toHaveBeenCalled();
  });

  it("rejects a signed-in non-admin user", async () => {
    getAdminAccessMock.mockResolvedValue({
      status: "forbidden",
      user: { ...admin, role: "USER" },
    });

    const response = await POST(createRequest(validProduct));

    expect(response.status).toBe(403);
    expect(productCreateMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      })
    );

    expect(response.status).toBe(400);
    expect(productCreateMock).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid product values", async () => {
    const response = await POST(
      createRequest({
        ...validProduct,
        name: " ",
        price: -1,
        stockCount: 1.5,
        discountPercent: 101,
        imageUrl: "javascript:alert(1)",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Enter valid product details.",
      fieldErrors: expect.objectContaining({
        name: expect.any(String),
        price: expect.any(String),
        stockCount: expect.any(String),
        discountPercent: expect.any(String),
        imageUrl: expect.any(String),
      }),
    });
    expect(productCreateMock).not.toHaveBeenCalled();
  });

  it("creates a normalized product for an administrator", async () => {
    const createdProduct = {
      id: "product-1",
      ...validProduct,
      name: "Wireless Headphones",
      description: "Comfortable headphones with active noise cancellation.",
      category: "Audio",
      createdAt: new Date("2026-09-12T12:00:00.000Z"),
    };
    productCreateMock.mockResolvedValue(createdProduct);

    const response = await POST(createRequest(validProduct));

    expect(response.status).toBe(201);
    expect(productCreateMock).toHaveBeenCalledWith({
      data: {
        name: "Wireless Headphones",
        description:
          "Comfortable headphones with active noise cancellation.",
        category: "Audio",
        imageUrl: validProduct.imageUrl,
        price: 149.99,
        stockCount: 18,
        discountPercent: 10,
        isFeatured: true,
        isNew: true,
        isBestSeller: false,
      },
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
    expect(await response.json()).toEqual({
      product: {
        ...createdProduct,
        createdAt: createdProduct.createdAt.toISOString(),
      },
    });
  });
});
