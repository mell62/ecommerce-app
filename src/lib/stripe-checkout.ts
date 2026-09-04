import type Stripe from "stripe";

export type StripeCheckoutProduct = Readonly<{
  name: string;
  unitPrice: number;
  quantity: number;
}>;

export type StripeCheckoutFees = Readonly<{
  shippingCost: number;
  estimatedTax: number;
}>;

export function toStripeAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Stripe amounts must be finite, non-negative numbers.");
  }

  return Math.round((amount + Number.EPSILON) * 100);
}

export function buildStripeCheckoutLineItems(
  products: readonly StripeCheckoutProduct[],
  fees: StripeCheckoutFees
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lineItems = products.map((product) => {
    const name = product.name.trim();

    if (!name) {
      throw new Error("Stripe checkout products require a name.");
    }

    if (!Number.isInteger(product.quantity) || product.quantity < 1) {
      throw new Error("Stripe checkout quantities must be positive integers.");
    }

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name,
        },
        unit_amount: toStripeAmount(product.unitPrice),
      },
      quantity: product.quantity,
    } satisfies Stripe.Checkout.SessionCreateParams.LineItem;
  });

  if (fees.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Standard shipping",
        },
        unit_amount: toStripeAmount(fees.shippingCost),
      },
      quantity: 1,
    });
  }

  if (fees.estimatedTax > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Estimated tax",
        },
        unit_amount: toStripeAmount(fees.estimatedTax),
      },
      quantity: 1,
    });
  }

  return lineItems;
}
