import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartContents from "@/components/CartContents";
import CartProvider from "@/components/CartProvider";

const navigationState = vi.hoisted(() => ({ pathname: "/cart" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

const cartItem = {
  id: "product-1",
  name: "Zeus Wireless Mouse",
  description: "A precise wireless mouse for comfortable everyday use.",
  price: 53.99,
  originalPrice: 59.99,
  imageUrl: "/mouse.png",
  stockCount: 24,
  discountPercent: 10,
  isArchived: false,
  quantity: 2,
};

describe("CartContents accessibility", () => {
  beforeEach(() => {
    navigationState.pathname = "/cart";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ items: [cartItem] }), {
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

  it("has no detectable accessibility violations with a cart item", async () => {
    const { container } = render(
      <CartProvider isAuthenticated>
        <CartContents />
      </CartProvider>
    );

    expect(
      await screen.findByText("1 product in your cart")
    ).toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("marks an archived product unavailable and disables checkout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [{ ...cartItem, isArchived: true }],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      )
    );
    const { container } = render(
      <CartProvider isAuthenticated>
        <CartContents />
      </CartProvider>
    );

    expect(await screen.findByText("Unavailable")).toBeVisible();
    expect(
      screen.getByText("Remove unavailable products before checkout.")
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Checkout unavailable" })
    ).toBeDisabled();
    expect(
      screen.queryByRole("link", { name: cartItem.name })
    ).not.toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("reloads the cart when navigating back from an admin page", async () => {
    navigationState.pathname = "/admin/products";
    let cartRequests = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        cartRequests += 1;

        return Promise.resolve(
          Response.json({
            items: [
              {
                ...cartItem,
                isArchived: cartRequests > 1,
              },
            ],
          })
        );
      })
    );
    const getContents = () => (
      <CartProvider isAuthenticated>
        <CartContents />
      </CartProvider>
    );
    const { rerender } = render(getContents());

    expect(await screen.findByText(cartItem.name)).toBeVisible();

    navigationState.pathname = "/cart";
    rerender(getContents());

    expect(await screen.findByText("Unavailable")).toBeVisible();
    expect(cartRequests).toBe(2);
  });
});
