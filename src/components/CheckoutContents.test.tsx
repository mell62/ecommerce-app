import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartProvider from "@/components/CartProvider";
import CheckoutContents from "@/components/CheckoutContents";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
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
  quantity: 2,
};

describe("CheckoutContents accessibility", () => {
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

  it("has no detectable accessibility violations with an order summary", async () => {
    const { container } = render(
      <CartProvider isAuthenticated>
        <CheckoutContents />
      </CartProvider>
    );

    expect(
      await screen.findByRole("button", { name: "Place order" })
    ).toBeEnabled();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
