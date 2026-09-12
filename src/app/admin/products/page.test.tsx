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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
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
    _count: {
      orderItems: 0,
    },
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
    _count: {
      orderItems: 2,
    },
  },
];

describe("AdminProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows catalog and inventory details accessibly", async () => {
    productFindManyMock.mockResolvedValue(products);

    const page = await AdminProductsPage({
      searchParams: Promise.resolve({}),
    });
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
    expect(
      screen.getByRole("link", { name: "Edit Gaming Mouse" })
    ).toHaveAttribute("href", "/admin/products/product-1/edit");
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
        _count: {
          select: {
            orderItems: true,
          },
        },
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

    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "No products yet" })
    ).toBeInTheDocument();
    expect(screen.getByText("0 products")).toBeInTheDocument();
  });

  it("shows only low-stock inventory when requested", async () => {
    productFindManyMock.mockResolvedValue([products[0]]);

    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ stock: "low" }),
      })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Low-stock inventory" })
    ).toBeInTheDocument();
    expect(screen.getByText("1 product")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all products" })).toHaveAttribute(
      "href",
      "/admin/products"
    );
    expect(productFindManyMock).toHaveBeenCalledWith({
      where: {
        stockCount: {
          lte: 10,
        },
      },
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
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  });

  it("shows one clear action when no products have low stock", async () => {
    productFindManyMock.mockResolvedValue([]);

    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ stock: "low" }),
      })
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "No low-stock products" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "View all products" })
    ).toHaveLength(1);
  });

  it("confirms that a product was created", async () => {
    productFindManyMock.mockResolvedValue(products);

    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ created: "true" }),
      })
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Product created successfully."
    );
  });

  it("confirms that a product was updated", async () => {
    productFindManyMock.mockResolvedValue(products);

    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ updated: "true" }),
      })
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Product updated successfully."
    );
  });

  it("confirms that a product was deleted", async () => {
    productFindManyMock.mockResolvedValue(products);

    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ deleted: "true" }),
      })
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Product deleted successfully."
    );
  });
});
