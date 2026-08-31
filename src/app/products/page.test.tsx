import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WishlistProvider from "@/components/WishlistProvider";
import ProductsPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const product = {
  id: "product-1",
  name: "Zeus Wireless Mouse",
  description: "A precise wireless mouse for comfortable everyday use.",
  price: 59.99,
  imageUrl: "/mouse.png",
  stockCount: 24,
  discountPercent: 10,
  isNew: true,
  isBestSeller: true,
  isFeatured: false,
  reviews: [{ rating: 5 }, { rating: 4 }],
};

describe("ProductsPage accessibility", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([product]), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has no detectable accessibility violations with a product card", async () => {
    const page = await ProductsPage({ searchParams: Promise.resolve({}) });
    const { container } = render(
      <WishlistProvider isAuthenticated={false}>{page}</WishlistProvider>
    );

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
