import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartProvider from "@/components/CartProvider";
import CheckoutContents from "@/components/CheckoutContents";

const redirectToStripeCheckoutMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/checkout-navigation", () => ({
  redirectToStripeCheckout: redirectToStripeCheckoutMock,
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

async function enterRequiredShippingAddress(): Promise<void> {
  fireEvent.change(await screen.findByLabelText("Street address"), {
    target: { value: "123 Technology Avenue" },
  });
  fireEvent.change(screen.getByLabelText("City"), {
    target: { value: "Austin" },
  });
  fireEvent.change(screen.getByLabelText("State"), {
    target: { value: "Texas" },
  });
  fireEvent.change(screen.getByLabelText("ZIP code"), {
    target: { value: "78701" },
  });
}

describe("CheckoutContents accessibility", () => {
  const cartResponse = new Response(JSON.stringify({ items: [cartItem] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });

  beforeEach(() => {
    redirectToStripeCheckoutMock.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(cartResponse.clone())
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
      await screen.findByRole("button", { name: "Continue to payment" })
    ).toBeEnabled();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("shows field-specific errors and focuses the first invalid address field", async () => {
    render(
      <CartProvider isAuthenticated>
        <CheckoutContents initialFullName="Alex Morgan" />
      </CartProvider>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Continue to payment" })
    );

    expect(screen.getByText("Enter a complete street address.")).toBeVisible();
    expect(screen.getByText("Enter a city.")).toBeVisible();
    expect(screen.getByText("Enter a state.")).toBeVisible();
    expect(
      screen.getByText("Enter a valid 5-digit or ZIP+4 code.")
    ).toBeVisible();
    expect(screen.getByLabelText("Street address")).toHaveFocus();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("creates an order and redirects the customer to Stripe Checkout", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(cartResponse.clone())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "order-1" }), {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            checkoutUrl: "https://checkout.stripe.com/c/pay/test",
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CartProvider isAuthenticated>
        <CheckoutContents initialFullName="Alex Morgan" />
      </CartProvider>
    );

    await enterRequiredShippingAddress();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to payment" })
    );

    await waitFor(() => {
      expect(redirectToStripeCheckoutMock).toHaveBeenCalledWith(
        "https://checkout.stripe.com/c/pay/test"
      );
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/orders",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/checkout/session",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ orderId: "order-1" }),
      })
    );
  });

  it("shows the API error instead of redirecting when payment cannot start", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(cartResponse.clone())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "order-1" }), {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Stripe is unavailable." }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            checkoutUrl: "https://checkout.stripe.com/c/pay/retry",
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CartProvider isAuthenticated>
        <CheckoutContents initialFullName="Alex Morgan" />
      </CartProvider>
    );

    await enterRequiredShippingAddress();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to payment" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Stripe is unavailable."
    );
    expect(redirectToStripeCheckoutMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Your order is ready for payment" })
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Try payment again" })
    );

    await waitFor(() => {
      expect(redirectToStripeCheckoutMock).toHaveBeenCalledWith(
        "https://checkout.stripe.com/c/pay/retry"
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/checkout/session",
      expect.objectContaining({
        body: JSON.stringify({ orderId: "order-1" }),
      })
    );
  });
});
