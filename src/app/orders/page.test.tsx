import { PaymentStatus } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrdersPage from "./page";

const findManyMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const order = {
  id: "order-12345678",
  userId: "customer-1",
  status: "DELIVERED",
  subtotal: 107.98,
  shippingCost: 0,
  estimatedTax: 8.64,
  totalPrice: 116.62,
  paymentStatus: PaymentStatus.PAID,
  stripeCheckoutSessionId: "cs_test_paid",
  createdAt: new Date("2026-08-25T12:00:00.000Z"),
  items: [
    {
      id: "order-item-1",
      quantity: 2,
      price: 53.99,
      product: {
        id: "product-1",
        name: "Zeus Wireless Mouse",
        imageUrl: "/mouse.png",
      },
    },
  ],
};

describe("OrdersPage accessibility", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    getCurrentUserMock.mockReset();
    findManyMock.mockResolvedValue([order]);
    getCurrentUserMock.mockResolvedValue({
      id: "customer-1",
      name: "Alex",
    });
  });

  it("has no detectable accessibility violations with order history", async () => {
    const page = await OrdersPage({
      searchParams: Promise.resolve({
        payment: "success",
        session_id: "cs_test_paid",
      }),
    });
    const { container } = render(page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Your orders" })
    ).toBeInTheDocument();
    expect(screen.getByText("Payment received")).toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("does not claim payment success before the webhook confirms it", async () => {
    findManyMock.mockResolvedValue([
      {
        ...order,
        status: "PENDING",
        paymentStatus: PaymentStatus.PENDING,
      },
    ]);

    const page = await OrdersPage({
      searchParams: Promise.resolve({
        payment: "success",
        session_id: "cs_test_paid",
      }),
    });
    render(page);

    expect(screen.getByText("Confirming your payment")).toBeInTheDocument();
    expect(screen.queryByText("Payment received")).not.toBeInTheDocument();
  });

  it("explains when the customer cancels Stripe Checkout", async () => {
    findManyMock.mockResolvedValue([
      {
        ...order,
        status: "PENDING",
        paymentStatus: PaymentStatus.PENDING,
      },
    ]);

    const page = await OrdersPage({
      searchParams: Promise.resolve({
        payment: "cancelled",
        order_id: order.id,
      }),
    });
    render(page);

    expect(screen.getByText("Payment not completed")).toBeInTheDocument();
    expect(
      screen.getByText(/Your order is saved so you can complete it later/)
    ).toBeInTheDocument();
  });
});
