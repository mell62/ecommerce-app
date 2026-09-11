import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProductsPage from "@/app/admin/products/page";

const productFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: productFindManyMock,
    },
  },
}));

const products = [
  {
    id: "product-1",
    name: "Gaming Mouse",
    category: "Accessories",
    imageUrl: "/mouse.png",
    price: 59.99,
    stockCount: 4,
    discountPercent: 15,
    isFeatured: true,
    isNew: false,
    isBestSeller: true,
  },
  {
    id: "product-2",
    name: "Studio Monitor",
    category: "Monitors",
    imageUrl: "/monitor.png",
    price: 299.99,
    stockCount: 0,
    discountPercent: 0,
    isFeatured: false,
    isNew: true,
    isBestSeller: false,
  },
];

describe("AdminProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows catalog and inventory details accessibly", async () => {
    productFindManyMock.mockResolvedValue(products);

    const page = await AdminProductsPage();
    const { container } = render(page);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Products and inventory",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("2 products")).toBeInTheDocument();
    expect(screen.getByText("4 in stock · Low")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByText("15% discount")).toBeInTheDocument();
    expect(productFindManyMock).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true,
        price: true,
        stockCount: true,
        discountPercent: true,
        isFeatured: true,
        isNew: true,
        isBestSeller: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("shows an empty state when the catalog has no products", async () => {
    productFindManyMock.mockResolvedValue([]);

    render(await AdminProductsPage());

    expect(
      screen.getByRole("heading", { level: 2, name: "No products yet" })
    ).toBeInTheDocument();
    expect(screen.getByText("0 products")).toBeInTheDocument();
  });
});
