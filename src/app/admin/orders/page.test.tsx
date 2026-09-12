import { PaymentStatus } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrdersPage from "@/app/admin/orders/page";

const orderFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findMany: orderFindManyMock,
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const orders = [
  {
    id: "order-12345678",
    status: "PROCESSING",
    paymentStatus: PaymentStatus.PAID,
    totalPrice: 169.98,
    createdAt: new Date("2026-09-10T10:00:00.000Z"),
    user: {
      name: "Sherlock",
      email: "sherlock@example.com",
    },
    items: [
      {
        id: "item-1",
        quantity: 2,
        price: 84.99,
        product: {
          id: "product-1",
          name: "Mechanical Keyboard",
        },
      },
    ],
  },
  {
    id: "order-87654321",
    status: "PENDING",
    paymentStatus: PaymentStatus.PENDING,
    totalPrice: 59.99,
    createdAt: new Date("2026-09-09T10:00:00.000Z"),
    user: {
      name: "Watson",
      email: "watson@example.com",
    },
    items: [
      {
        id: "item-2",
        quantity: 1,
        price: 59.99,
        product: {
          id: "product-2",
          name: "Gaming Mouse",
        },
      },
    ],
  },
];

describe("AdminOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows customer order and payment details accessibly", async () => {
    orderFindManyMock.mockResolvedValue(orders);

    const { container } = render(
      await AdminOrdersPage({ searchParams: Promise.resolve({}) })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Customer orders" })
    ).toBeInTheDocument();
    expect(screen.getByText("2 orders")).toBeInTheDocument();
    expect(screen.getByText("Sherlock")).toBeInTheDocument();
    expect(screen.getByText("sherlock@example.com")).toBeInTheDocument();
    expect(screen.getByText("Mechanical Keyboard × 2")).toBeInTheDocument();
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Payment Paid")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as shipped" })
    ).toBeInTheDocument();
    expect(orderFindManyMock).toHaveBeenCalledWith({
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalPrice: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("shows an empty state when no orders exist", async () => {
    orderFindManyMock.mockResolvedValue([]);

    render(await AdminOrdersPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "No customer orders yet",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("0 orders")).toBeInTheDocument();
  });

  it("shows only paid orders awaiting fulfillment when requested", async () => {
    orderFindManyMock.mockResolvedValue([orders[0]]);

    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ view: "fulfillment" }),
      })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Awaiting fulfillment" })
    ).toBeInTheDocument();
    expect(screen.getByText("1 order")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all orders" })).toHaveAttribute(
      "href",
      "/admin/orders"
    );
    expect(orderFindManyMock).toHaveBeenCalledWith({
      where: {
        paymentStatus: PaymentStatus.PAID,
        status: {
          in: ["PROCESSING", "SHIPPED"],
        },
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalPrice: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  it("shows one clear action when no orders await fulfillment", async () => {
    orderFindManyMock.mockResolvedValue([]);

    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ view: "fulfillment" }),
      })
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "No orders awaiting fulfillment",
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "View all orders" })
    ).toHaveLength(1);
  });

  it("shows only orders included in paid revenue when requested", async () => {
    orderFindManyMock.mockResolvedValue([orders[0]]);

    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ payment: "paid" }),
      })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Paid orders" })
    ).toBeInTheDocument();
    expect(screen.getByText("1 order")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all orders" })).toHaveAttribute(
      "href",
      "/admin/orders"
    );
    expect(orderFindManyMock).toHaveBeenCalledWith({
      where: {
        paymentStatus: PaymentStatus.PAID,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalPrice: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  it("confirms that an order status was updated", async () => {
    orderFindManyMock.mockResolvedValue(orders);

    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ updated: "true" }),
      })
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Order status updated successfully."
    );
  });
});
