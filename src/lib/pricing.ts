export const FREE_SHIPPING_THRESHOLD = 50;
export const STANDARD_SHIPPING_COST = 5.99;
export const ESTIMATED_TAX_RATE = 0.08;

export type OrderPricing = Readonly<{
  subtotal: number;
  shippingCost: number;
  estimatedTax: number;
  total: number;
  amountUntilFreeShipping: number;
  qualifiesForFreeShipping: boolean;
}>;

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function getDiscountedPrice(
  price: number,
  discountPercent: number
): number {
  if (!discountPercent || discountPercent <= 0) {
    return Number(price.toFixed(2));
  }

  return Number((price - (price * discountPercent) / 100).toFixed(2));
}

export function hasDiscount(discountPercent: number): boolean {
  return discountPercent > 0;
}

export function calculateOrderPricing(subtotal: number): OrderPricing {
  const normalizedSubtotal = Math.max(0, roundCurrency(subtotal));
  const qualifiesForFreeShipping =
    normalizedSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost =
    normalizedSubtotal === 0 || qualifiesForFreeShipping
      ? 0
      : STANDARD_SHIPPING_COST;
  const estimatedTax = roundCurrency(normalizedSubtotal * ESTIMATED_TAX_RATE);
  const total = roundCurrency(normalizedSubtotal + shippingCost + estimatedTax);
  const amountUntilFreeShipping = Math.max(
    0,
    roundCurrency(FREE_SHIPPING_THRESHOLD - normalizedSubtotal)
  );

  return {
    subtotal: normalizedSubtotal,
    shippingCost,
    estimatedTax,
    total,
    amountUntilFreeShipping,
    qualifiesForFreeShipping,
  };
}
