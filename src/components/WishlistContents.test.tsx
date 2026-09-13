import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartProvider from "@/components/CartProvider";
import WishlistContents from "@/components/WishlistContents";
import WishlistProvider from "@/components/WishlistProvider";

const navigationState = vi.hoisted(() => ({ pathname: "/wishlist" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

const wishlistProduct = {
  id: "product-1",
  name: "Zeus Wireless Mouse",
  description: "A precise wireless mouse for comfortable everyday use.",
  price: 59.99,
  imageUrl: "/mouse.png",
  stockCount: 24,
  discountPercent: 10,
  isArchived: false,
};

function getRequestPath(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }

  return input instanceof URL ? input.pathname : new URL(input.url).pathname;
}

describe("WishlistContents accessibility", () => {
  beforeEach(() => {
    navigationState.pathname = "/wishlist";
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

  it("keeps an archived product removable without offering cart actions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const path = getRequestPath(input);
        const data =
          path === "/api/wishlist"
            ? { items: [{ ...wishlistProduct, isArchived: true }] }
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
    const { container } = render(
      <CartProvider isAuthenticated>
        <WishlistProvider isAuthenticated>
          <WishlistContents />
        </WishlistProvider>
      </CartProvider>
    );

    expect(
      await screen.findByRole("button", { name: "Unavailable" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: `Remove ${wishlistProduct.name} from wishlist`,
      })
    ).toBeEnabled();
    expect(
      screen.queryByRole("link", { name: wishlistProduct.name })
    ).not.toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("reloads the wishlist when navigating back from an admin page", async () => {
    navigationState.pathname = "/admin/products";
    let wishlistRequests = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const path = getRequestPath(input);

        if (path !== "/api/wishlist") {
          return Promise.resolve(Response.json({ items: [] }));
        }

        wishlistRequests += 1;

        return Promise.resolve(
          Response.json({
            items: [
              {
                ...wishlistProduct,
                isArchived: wishlistRequests > 1,
              },
            ],
          })
        );
      })
    );
    const getContents = () => (
      <CartProvider isAuthenticated>
        <WishlistProvider isAuthenticated>
          <WishlistContents />
        </WishlistProvider>
      </CartProvider>
    );
    const { rerender } = render(getContents());

    expect(
      await screen.findByRole("button", { name: "Add to cart" })
    ).toBeEnabled();

    navigationState.pathname = "/wishlist";
    rerender(getContents());

    expect(
      await screen.findByRole("button", { name: "Unavailable" })
    ).toBeDisabled();
    expect(wishlistRequests).toBe(2);
  });
});
