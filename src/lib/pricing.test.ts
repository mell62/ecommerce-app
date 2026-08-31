import { describe, expect, it } from "vitest";
import {
  calculateOrderPricing,
  getDiscountedPrice,
  hasDiscount,
} from "@/lib/pricing";

describe("getDiscountedPrice", () => {
  it("applies a percentage discount and rounds to the nearest cent", () => {
    expect(getDiscountedPrice(59.99, 15)).toBe(50.99);
  });

  it("keeps the original price when there is no valid discount", () => {
    expect(getDiscountedPrice(59.99, 0)).toBe(59.99);
    expect(getDiscountedPrice(59.99, -10)).toBe(59.99);
  });
});

describe("hasDiscount", () => {
  it("only reports positive discount percentages", () => {
    expect(hasDiscount(10)).toBe(true);
    expect(hasDiscount(0)).toBe(false);
    expect(hasDiscount(-10)).toBe(false);
  });
});

describe("calculateOrderPricing", () => {
  it("returns zero charges for an empty cart", () => {
    expect(calculateOrderPricing(0)).toEqual({
      subtotal: 0,
      shippingCost: 0,
      estimatedTax: 0,
      total: 0,
      amountUntilFreeShipping: 50,
      qualifiesForFreeShipping: false,
    });
  });

  it("normalizes a negative subtotal to zero", () => {
    expect(calculateOrderPricing(-25)).toEqual(calculateOrderPricing(0));
  });

  it("charges shipping and tax below the free-shipping threshold", () => {
    expect(calculateOrderPricing(49.99)).toEqual({
      subtotal: 49.99,
      shippingCost: 5.99,
      estimatedTax: 4,
      total: 59.98,
      amountUntilFreeShipping: 0.01,
      qualifiesForFreeShipping: false,
    });
  });

  it("unlocks free shipping at exactly the threshold", () => {
    expect(calculateOrderPricing(50)).toEqual({
      subtotal: 50,
      shippingCost: 0,
      estimatedTax: 4,
      total: 54,
      amountUntilFreeShipping: 0,
      qualifiesForFreeShipping: true,
    });
  });

  it("rounds the subtotal before applying threshold and tax rules", () => {
    expect(calculateOrderPricing(49.999)).toEqual({
      subtotal: 50,
      shippingCost: 0,
      estimatedTax: 4,
      total: 54,
      amountUntilFreeShipping: 0,
      qualifiesForFreeShipping: true,
    });
  });
});
