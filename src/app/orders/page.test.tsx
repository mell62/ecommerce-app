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
      searchParams: Promise.resolve({ success: "true" }),
    });
    const { container } = render(page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Your orders" })
    ).toBeInTheDocument();
    expect(screen.getByText("Order placed successfully")).toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
