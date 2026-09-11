import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CompletePaymentButton from "@/components/CompletePaymentButton";

const redirectToStripeCheckoutMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/checkout-navigation", () => ({
  redirectToStripeCheckout: redirectToStripeCheckoutMock,
}));

describe("CompletePaymentButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <CompletePaymentButton orderId="order-1" />
    );

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("opens Stripe Checkout for the existing order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          checkoutUrl: "https://checkout.stripe.com/c/pay/existing-order",
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
    render(<CompletePaymentButton orderId="order-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Complete payment" }));

    await waitFor(() => {
      expect(redirectToStripeCheckoutMock).toHaveBeenCalledWith(
        "https://checkout.stripe.com/c/pay/existing-order"
      );
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/checkout/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId: "order-1" }),
    });
  });

  it("disables the button while Stripe Checkout is being prepared", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        })
      )
    );
    render(<CompletePaymentButton orderId="order-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Complete payment" }));

    expect(
      screen.getByRole("button", { name: "Opening secure payment..." })
    ).toBeDisabled();

    resolveRequest?.(
      new Response(
        JSON.stringify({ checkoutUrl: "https://checkout.stripe.com/test" }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    await waitFor(() => {
      expect(redirectToStripeCheckoutMock).toHaveBeenCalledOnce();
    });
  });

  it("shows an accessible error when payment cannot be started", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Payment is unavailable." }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
    );
    render(<CompletePaymentButton orderId="order-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Complete payment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Payment is unavailable."
    );
    expect(redirectToStripeCheckoutMock).not.toHaveBeenCalled();
  });
});
