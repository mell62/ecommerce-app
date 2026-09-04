import { describe, expect, it } from "vitest";
import {
  buildStripeCheckoutLineItems,
  toStripeAmount,
} from "@/lib/stripe-checkout";

describe("toStripeAmount", () => {
  it.each([
    [59.99, 5999],
    [50.99, 5099],
    [0.1, 10],
    [0, 0],
  ])("converts $%s to %s cents", (amount, expected) => {
    expect(toStripeAmount(amount)).toBe(expected);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid amount %s",
    (amount) => {
      expect(() => toStripeAmount(amount)).toThrow(
        "Stripe amounts must be finite, non-negative numbers."
      );
    }
  );
});

describe("buildStripeCheckoutLineItems", () => {
  it("builds trusted product, shipping, and tax line items", () => {
    const lineItems = buildStripeCheckoutLineItems(
      [
        {
          name: "  Zeus Wireless Mouse  ",
          unitPrice: 50.99,
          quantity: 2,
        },
      ],
      {
        shippingCost: 5.99,
        estimatedTax: 8.16,
      }
    );

    expect(lineItems).toEqual([
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Zeus Wireless Mouse",
          },
          unit_amount: 5099,
        },
        quantity: 2,
      },
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Standard shipping",
          },
          unit_amount: 599,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Estimated tax",
          },
          unit_amount: 816,
        },
        quantity: 1,
      },
    ]);
  });

  it("omits zero-value shipping and tax lines", () => {
    const lineItems = buildStripeCheckoutLineItems(
      [
        {
          name: "Zeus Keyboard",
          unitPrice: 89,
          quantity: 1,
        },
      ],
      {
        shippingCost: 0,
        estimatedTax: 0,
      }
    );

    expect(lineItems).toHaveLength(1);
    expect(lineItems[0]?.price_data?.product_data?.name).toBe("Zeus Keyboard");
  });

  it("rejects products without a name", () => {
    expect(() =>
      buildStripeCheckoutLineItems(
        [{ name: "   ", unitPrice: 10, quantity: 1 }],
        { shippingCost: 0, estimatedTax: 0 }
      )
    ).toThrow("Stripe checkout products require a name.");
  });

  it.each([0, 1.5, -1])("rejects invalid quantity %s", (quantity) => {
    expect(() =>
      buildStripeCheckoutLineItems(
        [{ name: "Zeus Mouse", unitPrice: 10, quantity }],
        { shippingCost: 0, estimatedTax: 0 }
      )
    ).toThrow("Stripe checkout quantities must be positive integers.");
  });
});
