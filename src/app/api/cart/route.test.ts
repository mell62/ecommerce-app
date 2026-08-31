import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH, POST } from "./route";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const cartFindUniqueMock = vi.hoisted(() => vi.fn());
const cartItemDeleteManyMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const transactionClient = vi.hoisted(() => ({
  product: {
    findUnique: vi.fn(),
  },
  cart: {
    upsert: vi.fn(),
  },
  cartItem: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
    cart: {
      findUnique: cartFindUniqueMock,
    },
    cartItem: {
      deleteMany: cartItemDeleteManyMock,
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
  return new Request("http://localhost/api/cart", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("cart API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(currentUser);
    transactionMock.mockImplementation(
      async (
        callback: (client: typeof transactionClient) => Promise<unknown>
      ) => callback(transactionClient)
    );
  });

  it("requires authentication before adding a product", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await POST(
      createRequest("POST", { productId: product.id, quantity: 1 })
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, "1"])(
    "rejects an invalid quantity of %s",
    async (quantity) => {
      const response = await POST(
        createRequest("POST", { productId: product.id, quantity })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Quantity must be a positive whole number.",
      });
      expect(transactionMock).not.toHaveBeenCalled();
    }
  );

  it("checks requested quantity together with the existing cart quantity", async () => {
    transactionClient.product.findUnique.mockResolvedValue(product);
    transactionClient.cart.upsert.mockResolvedValue({ id: "cart-1" });
    transactionClient.cartItem.findUnique.mockResolvedValue({ quantity: 4 });

    const response = await POST(
      createRequest("POST", { productId: product.id, quantity: 2 })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Only 5 available." });
    expect(transactionClient.cartItem.upsert).not.toHaveBeenCalled();
  });

  it("adds an in-stock product and returns its discounted price", async () => {
    transactionClient.product.findUnique.mockResolvedValue(product);
    transactionClient.cart.upsert.mockResolvedValue({ id: "cart-1" });
    transactionClient.cartItem.findUnique.mockResolvedValue(null);
    transactionClient.cartItem.upsert.mockResolvedValue({ quantity: 2 });

    const response = await POST(
      createRequest("POST", { productId: product.id, quantity: 2 })
    );

    expect(response.status).toBe(201);
    expect(transactionClient.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          cartId: "cart-1",
          productId: product.id,
          quantity: 2,
        },
      })
    );
    expect(await response.json()).toEqual({
      message: "Product added to cart.",
      item: {
        ...product,
        originalPrice: 59.99,
        price: 50.99,
        quantity: 2,
      },
    });
  });

  it("prevents an update above the current stock count", async () => {
    transactionClient.cartItem.findFirst.mockResolvedValue({
      id: "cart-item-1",
      product,
    });

    const response = await PATCH(
      createRequest("PATCH", { productId: product.id, quantity: 6 })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Only 5 available." });
    expect(transactionClient.cartItem.update).not.toHaveBeenCalled();
  });

  it("loads cart items with server-calculated discounted prices", async () => {
    cartFindUniqueMock.mockResolvedValue({
      items: [{ product, quantity: 2 }],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [
        {
          ...product,
          originalPrice: 59.99,
          price: 50.99,
          quantity: 2,
        },
      ],
    });
  });

  it("scopes product removal to the authenticated user's cart", async () => {
    cartItemDeleteManyMock.mockResolvedValue({ count: 1 });

    const response = await DELETE(
      createRequest("DELETE", { productId: product.id })
    );

    expect(response.status).toBe(200);
    expect(cartItemDeleteManyMock).toHaveBeenCalledWith({
      where: {
        productId: product.id,
        cart: {
          userId: currentUser.id,
        },
      },
    });
  });
});
