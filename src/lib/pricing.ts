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
