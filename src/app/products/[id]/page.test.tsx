import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartProvider from "@/components/CartProvider";
import WishlistProvider from "@/components/WishlistProvider";
import ProductPage from "./page";

const findFirstMock = vi.hoisted(() => vi.fn());
const findManyMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findFirst: findFirstMock,
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  usePathname: () => "/products/product-1",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const product = {
  id: "product-1",
  name: "Zeus Wireless Mouse",
  description: "A precise wireless mouse for comfortable everyday use.",
  category: "Accessories",
  price: 59.99,
  imageUrl: "/mouse.png",
  stockCount: 24,
  discountPercent: 10,
  isNew: true,
  isBestSeller: true,
  isFeatured: true,
  reviews: [
    {
      id: "review-1",
      userId: "customer-2",
      name: "Jamie",
      rating: 5,
      comment: "Comfortable to use throughout the workday.",
      createdAt: new Date("2026-08-20T12:00:00.000Z"),
    },
    {
      id: "review-2",
      userId: "customer-3",
      name: "Taylor",
      rating: 4,
      comment: "Responsive tracking with a comfortable shape.",
      createdAt: new Date("2026-08-18T12:00:00.000Z"),
    },
  ],
};

const relatedProduct = {
  ...product,
  id: "product-2",
  name: "Zeus Mechanical Keyboard",
  imageUrl: "/keyboard.png",
  reviews: [{ rating: 4 }],
};

describe("ProductPage accessibility", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    findManyMock.mockReset();
    getCurrentUserMock.mockReset();
    notFoundMock.mockReset();
    findFirstMock.mockResolvedValue(product);
    findManyMock.mockResolvedValue([relatedProduct]);
    getCurrentUserMock.mockResolvedValue({
      id: "customer-1",
      name: "Alex",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          status: "ready",
          summary: "Customers praise its comfort and responsive tracking.",
          reviewCount: 2,
          generatedAt: "2026-09-12T10:00:00.000Z",
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has no detectable accessibility violations with reviews", async () => {
    const page = await ProductPage({
      params: Promise.resolve({ id: product.id }),
    });
    const { container } = render(
      <WishlistProvider isAuthenticated={false}>
        <CartProvider isAuthenticated={false}>{page}</CartProvider>
      </WishlistProvider>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: product.name })
    ).toBeInTheDocument();
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        id: product.id,
        isArchived: false,
      },
      include: {
        reviews: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          category: product.category,
          isArchived: false,
          NOT: {
            id: product.id,
          },
        },
      })
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Leave a review" })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Customers praise its comfort and responsive tracking."
      )
    ).toBeVisible();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("treats an archived or missing product as not found", async () => {
    findFirstMock.mockResolvedValue(null);
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      ProductPage({
        params: Promise.resolve({ id: "archived-product" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "archived-product",
          isArchived: false,
        },
      })
    );
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
