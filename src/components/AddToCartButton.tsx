"use client";

import type { Product } from "@prisma/client";
import { getDiscountedPrice } from "@/lib/pricing";

type AddToCartButtonProps = {
  product: Product;
};

type StoredCartItem = {
  id: string;
  quantity: number;
  [key: string]: unknown;
};

function isStoredCartItem(value: unknown): value is StoredCartItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "quantity" in value &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  );
}

function getStoredCart(): StoredCartItem[] {
  const storedCart = localStorage.getItem("cart");

  if (!storedCart) {
    return [];
  }

  try {
    const cart: unknown = JSON.parse(storedCart);

    return Array.isArray(cart) ? cart.filter(isStoredCartItem) : [];
  } catch {
    return [];
  }
}

export default function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const isOutOfStock = product.stockCount === 0;

  const finalPrice = getDiscountedPrice(product.price, product.discountPercent);

  function handleClick(): void {
    const existing = getStoredCart();

    const found = existing.find((item) => item.id === product.id);

    if (found) {
      found.quantity += 1;
    } else {
      existing.push({
        ...product,
        price: finalPrice,
        originalPrice: product.price,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(existing));

    window.dispatchEvent(new Event("cartUpdated"));

    alert("Added to cart!");
  }

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock}
      className="mt-6 bg-black text-white px-6 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}
