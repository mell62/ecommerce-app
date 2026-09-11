import { PaymentStatus, Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const existingOrderFindUniqueMock = vi.hoisted(() => vi.fn());
const transactionClient = vi.hoisted(() => ({
  cart: {
    findUnique: vi.fn(),
  },
  cartItem: {
    deleteMany: vi.fn(),
  },
  order: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  product: {
    updateMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
    order: {
      findUnique: existingOrderFindUniqueMock,
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

const validShippingAddress = {
  fullName: "Alex Morgan",
  addressLine1: "123 Technology Avenue",
  addressLine2: "Apartment 4B",
  city: "Austin",
  state: "Texas",
  postalCode: "78701",
  country: "US",
};
const checkoutIdempotencyKey = "123e4567-e89b-42d3-a456-426614174000";

function createOrderRequest(
  body: unknown = {
    shippingAddress: validShippingAddress,
    checkoutIdempotencyKey,
  }
): Request {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

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
    transactionClient.order.findUnique.mockResolvedValue(null);
    existingOrderFindUniqueMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires authentication before placing an order", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await POST(createOrderRequest());

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid shipping address before opening a transaction", async () => {
    const response = await POST(
      createOrderRequest({
        shippingAddress: {
          ...validShippingAddress,
          postalCode: "invalid",
        },
        checkoutIdempotencyKey,
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Enter a valid shipping address.",
      fieldErrors: {
        postalCode: "Enter a valid 5-digit or ZIP+4 code.",
      },
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it.each([
    { shippingAddress: validShippingAddress },
    {
      shippingAddress: validShippingAddress,
      checkoutIdempotencyKey: "not-a-uuid",
    },
  ])("rejects a missing or invalid idempotency key %#", async (body) => {
    const response = await POST(createOrderRequest(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "A valid checkout idempotency key is required.",
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects an empty cart without creating an order", async () => {
    transactionClient.cart.findUnique.mockResolvedValue({
      id: "cart-1",
      items: [],
    });

    const response = await POST(createOrderRequest());

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

    const response = await POST(createOrderRequest());

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

    const response = await POST(createOrderRequest());

    expect(response.status).toBe(201);
    expect(transactionClient.order.create).toHaveBeenCalledWith({
      data: {
        status: "PENDING",
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 70.99,
        shippingCost: 0,
        estimatedTax: 5.68,
        totalPrice: 76.67,
        userId: currentUser.id,
        checkoutIdempotencyKey,
        shippingFullName: "Alex Morgan",
        shippingAddressLine1: "123 Technology Avenue",
        shippingAddressLine2: "Apartment 4B",
        shippingCity: "Austin",
        shippingState: "Texas",
        shippingPostalCode: "78701",
        shippingCountry: "US",
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

  it("returns the original order when the same checkout is retried", async () => {
    const existingOrder = {
      id: "order-existing",
      userId: currentUser.id,
      checkoutIdempotencyKey,
      items: [],
    };
    transactionClient.order.findUnique.mockResolvedValue(existingOrder);

    const response = await POST(createOrderRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(existingOrder);
    expect(transactionClient.cart.findUnique).not.toHaveBeenCalled();
    expect(transactionClient.order.create).not.toHaveBeenCalled();
    expect(transactionClient.product.updateMany).not.toHaveBeenCalled();
  });

  it("recovers the original order when concurrent creation hits the unique constraint", async () => {
    const existingOrder = {
      id: "order-concurrent",
      userId: currentUser.id,
      checkoutIdempotencyKey,
      items: [],
    };
    transactionMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      })
    );
    existingOrderFindUniqueMock.mockResolvedValue(existingOrder);

    const response = await POST(createOrderRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(existingOrder);
    expect(existingOrderFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_checkoutIdempotencyKey: {
            userId: currentUser.id,
            checkoutIdempotencyKey,
          },
        },
      })
    );
  });

  it("returns a stock conflict when an atomic decrement loses a race", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    transactionClient.cart.findUnique.mockResolvedValue(cart);
    transactionClient.order.create.mockResolvedValue({ id: "order-1" });
    transactionClient.product.updateMany.mockResolvedValueOnce({ count: 0 });

    const response = await POST(createOrderRequest());

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

    const response = await POST(createOrderRequest());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Stock changed during checkout. Please try again.",
    });
  });
});
