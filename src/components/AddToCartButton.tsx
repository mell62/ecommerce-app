"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Product } from "@prisma/client";
import { useCart } from "@/components/CartProvider";

type AddToCartButtonProps = Readonly<{
  product: Product;
}>;

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { items, isAuthenticated, isLoading, addProduct } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const cartItem = items.find((item) => item.id === product.id);
  const isOutOfStock = product.stockCount === 0;
  const isAtStockLimit = (cartItem?.quantity ?? 0) >= product.stockCount;
  const isDisabled =
    isOutOfStock ||
    isAtStockLimit ||
    isAdding ||
    (isAuthenticated && isLoading);

  async function handleClick(): Promise<void> {
    setMessage("");
    setError("");

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsAdding(true);

    try {
      await addProduct(product.id);
      setMessage("Added to cart.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to add product to cart."
      );
    } finally {
      setIsAdding(false);
    }
  }

  const label = isOutOfStock
    ? "Out of stock"
    : isAtStockLimit
      ? "Maximum quantity in cart"
      : isAdding
        ? "Adding..."
        : isLoading && isAuthenticated
          ? "Loading cart..."
          : "Add to cart";

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60"
      >
        {label}
      </button>

      {message && (
        <p className="mt-3 text-sm font-medium text-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
