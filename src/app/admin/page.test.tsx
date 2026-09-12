import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "@/app/admin/page";

const productCountMock = vi.hoisted(() => vi.fn());
const orderCountMock = vi.hoisted(() => vi.fn());
const orderAggregateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      count: productCountMock,
    },
    order: {
      count: orderCountMock,
      aggregate: orderAggregateMock,
    },
  },
}));

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productCountMock.mockResolvedValueOnce(12).mockResolvedValueOnce(3);
    orderCountMock.mockResolvedValue(2);
    orderAggregateMock.mockResolvedValue({
      _sum: {
        totalPrice: 1849.5,
      },
    });
  });

  it("introduces the protected workspace without accessibility violations", async () => {
    const { container } = render(await AdminPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Admin dashboard" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Products & Inventory",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Orders" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage orders" })).toHaveAttribute(
      "href",
      "/admin/orders"
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Operations overview" })
    ).toBeInTheDocument();
    expect(screen.getByText("Catalog products")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View catalog products" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Low stock")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View low stock" })).toHaveAttribute(
      "href",
      "/admin/products?stock=low"
    );
    expect(screen.getByText("Awaiting fulfillment")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View awaiting fulfillment" })
    ).toHaveAttribute("href", "/admin/orders?view=fulfillment");
    expect(screen.getByText("Paid revenue")).toBeInTheDocument();
    expect(screen.getByText("$1,849.50")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review paid orders" })
    ).toHaveAttribute("href", "/admin/orders?payment=paid");

    expect(productCountMock).toHaveBeenNthCalledWith(1);
    expect(productCountMock).toHaveBeenNthCalledWith(2, {
      where: {
        stockCount: {
          lte: 10,
        },
      },
    });
    expect(orderCountMock).toHaveBeenCalledWith({
      where: {
        paymentStatus: "PAID",
        status: {
          in: ["PROCESSING", "SHIPPED"],
        },
      },
    });
    expect(orderAggregateMock).toHaveBeenCalledWith({
      where: {
        paymentStatus: "PAID",
      },
      _sum: {
        totalPrice: true,
      },
    });

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
