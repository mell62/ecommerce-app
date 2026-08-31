import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartProvider from "@/components/CartProvider";
import WishlistProvider from "@/components/WishlistProvider";
import ProductPage from "./page";

const findUniqueMock = vi.hoisted(() => vi.fn());
const findManyMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findUnique: findUniqueMock,
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
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
    findUniqueMock.mockReset();
    findManyMock.mockReset();
    getCurrentUserMock.mockReset();
    findUniqueMock.mockResolvedValue(product);
    findManyMock.mockResolvedValue([relatedProduct]);
    getCurrentUserMock.mockResolvedValue({
      id: "customer-1",
      name: "Alex",
    });
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
    expect(
      screen.getByRole("heading", { level: 2, name: "Leave a review" })
    ).toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
