export function getDiscountedPrice(price, discountPercent) {
  if (!discountPercent || discountPercent <= 0) {
    return Number(price.toFixed(2));
  }

  return Number((price - (price * discountPercent) / 100).toFixed(2));
}

export function hasDiscount(discountPercent) {
  return discountPercent > 0;
}
