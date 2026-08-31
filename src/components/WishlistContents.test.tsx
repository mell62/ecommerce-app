import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartProvider from "@/components/CartProvider";
import WishlistContents from "@/components/WishlistContents";
import WishlistProvider from "@/components/WishlistProvider";

const wishlistProduct = {
  id: "product-1",
  name: "Zeus Wireless Mouse",
  description: "A precise wireless mouse for comfortable everyday use.",
  price: 59.99,
  imageUrl: "/mouse.png",
  stockCount: 24,
  discountPercent: 10,
};

function getRequestPath(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }

  return input instanceof URL ? input.pathname : new URL(input.url).pathname;
}

describe("WishlistContents accessibility", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const path = getRequestPath(input);
        const data =
          path === "/api/wishlist"
            ? { items: [wishlistProduct] }
            : { items: [] };

        return Promise.resolve(
          new Response(JSON.stringify(data), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          })
        );
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has no detectable accessibility violations with a saved product", async () => {
    const { container } = render(
      <CartProvider isAuthenticated>
        <WishlistProvider isAuthenticated>
          <WishlistContents />
        </WishlistProvider>
      </CartProvider>
    );

    expect(
      await screen.findByRole("button", { name: "Add to cart" })
    ).toBeEnabled();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
