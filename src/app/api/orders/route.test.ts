import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const transactionClient = vi.hoisted(() => ({
  cart: {
    findUnique: vi.fn(),
  },
  cartItem: {
    deleteMany: vi.fn(),
  },
  order: {
    create: vi.fn(),
  },
  product: {
    updateMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

const currentUser = {
  id: "customer-1",
  name: "Alex",
};

const cart = {
  id: "cart-1",
  items: [
    {
      quantity: 1,
      product: {
        id: "mouse",
        name: "Zeus Wireless Mouse",
        price: 59.99,
        stockCount: 5,
        discountPercent: 15,
      },
    },
    {
      quantity: 1,
      product: {
        id: "keyboard",
        name: "Zeus Keyboard",
        price: 20,
        stockCount: 8,
        discountPercent: 0,
      },
    },
  ],
};

describe("orders API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(currentUser);
    transactionMock.mockImplementation(
      async (
        callback: (client: typeof transactionClient) => Promise<unknown>
      ) => callback(transactionClient)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires authentication before placing an order", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects an empty cart without creating an order", async () => {
    transactionClient.cart.findUnique.mockResolvedValue({
      id: "cart-1",
      items: [],
    });

    const response = await POST();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Your cart is empty." });
    expect(transactionClient.order.create).not.toHaveBeenCalled();
  });

  it("rejects quantities that already exceed available stock", async () => {
    transactionClient.cart.findUnique.mockResolvedValue({
      id: "cart-1",
      items: [
        {
          quantity: 3,
          product: {
            id: "mouse",
            name: "Zeus Wireless Mouse",
            price: 59.99,
            stockCount: 2,
            discountPercent: 15,
          },
        },
      ],
    });

    const response = await POST();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Zeus Wireless Mouse only has 2 available.",
    });
    expect(transactionClient.order.create).not.toHaveBeenCalled();
  });

  it("calculates trusted totals, decrements stock, and clears the cart", async () => {
    const createdOrder = {
      id: "order-1",
      userId: currentUser.id,
      totalPrice: 76.67,
      items: [],
    };
    transactionClient.cart.findUnique.mockResolvedValue(cart);
    transactionClient.order.create.mockResolvedValue(createdOrder);
    transactionClient.product.updateMany.mockResolvedValue({ count: 1 });
    transactionClient.cartItem.deleteMany.mockResolvedValue({ count: 2 });

    const response = await POST();

    expect(response.status).toBe(201);
    expect(transactionClient.order.create).toHaveBeenCalledWith({
      data: {
        status: "PENDING",
        subtotal: 70.99,
        shippingCost: 0,
        estimatedTax: 5.68,
        totalPrice: 76.67,
        userId: currentUser.id,
        items: {
          create: [
            {
              productId: "mouse",
              quantity: 1,
              price: 50.99,
            },
            {
              productId: "keyboard",
              quantity: 1,
              price: 20,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    expect(transactionClient.product.updateMany).toHaveBeenCalledTimes(2);
    expect(transactionClient.product.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: "mouse",
        stockCount: {
          gte: 1,
        },
      },
      data: {
        stockCount: {
          decrement: 1,
        },
      },
    });
    expect(transactionClient.cartItem.deleteMany).toHaveBeenCalledWith({
      where: {
        cartId: cart.id,
      },
    });
  });

  it("returns a stock conflict when an atomic decrement loses a race", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    transactionClient.cart.findUnique.mockResolvedValue(cart);
    transactionClient.order.create.mockResolvedValue({ id: "order-1" });
    transactionClient.product.updateMany.mockResolvedValueOnce({ count: 0 });

    const response = await POST();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Zeus Wireless Mouse does not have enough stock available.",
    });
    expect(transactionClient.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it("asks the customer to retry a serializable transaction conflict", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    transactionMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Transaction conflict", {
        code: "P2034",
        clientVersion: "test",
      })
    );

    const response = await POST();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Stock changed during checkout. Please try again.",
    });
  });
});
