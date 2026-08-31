import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartContents from "@/components/CartContents";
import CartProvider from "@/components/CartProvider";

const cartItem = {
  id: "product-1",
  name: "Zeus Wireless Mouse",
  description: "A precise wireless mouse for comfortable everyday use.",
  price: 53.99,
  originalPrice: 59.99,
  imageUrl: "/mouse.png",
  stockCount: 24,
  discountPercent: 10,
  quantity: 2,
};

describe("CartContents accessibility", () => {
  beforeEach(() => {
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
});
