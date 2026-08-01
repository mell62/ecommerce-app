"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

function getOrderError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Failed to place order.";
}

export default function CheckoutContents() {
  const router = useRouter();
  const { items, isLoading, loadError, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const hasStockIssue = items.some(
    (item) => item.stockCount === 0 || item.quantity > item.stockCount
  );

  async function placeOrder(): Promise<void> {
    if (isPlacingOrder || hasStockIssue) {
      return;
    }

    setOrderError("");
    setIsPlacingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
      });
      const contentType = response.headers.get("content-type");
      const data: unknown = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(getOrderError(data));
      }

      clearCart();
      router.push("/orders?success=true");
      router.refresh();
    } catch (error) {
      setOrderError(
        error instanceof Error ? error.message : "Failed to place order."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-foreground">
          Checkout
        </h1>
        <p className="text-muted" role="status">
          Loading checkout...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-foreground">
          Checkout
        </h1>
        <div
          className="rounded-ui border border-border bg-surface p-6"
          role="alert"
        >
          <p className="font-semibold text-danger">{loadError}</p>
          <p className="mt-2 text-muted">Refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-foreground">
          Checkout
        </h1>
        <div className="rounded-ui border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            Your cart is empty
          </h2>
          <p className="mt-2 text-muted">
            Add a product before continuing to checkout.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight text-foreground">
        Checkout
      </h1>

      <div className="rounded-ui border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Order summary
        </h2>

        <div className="mt-5 divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 py-4 first:pt-0"
            >
              <div>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="mt-1 text-sm text-muted">
                  ${item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold text-foreground">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-5 text-xl font-bold text-foreground">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {hasStockIssue && (
          <p className="mt-4 text-sm text-danger" role="alert">
            Some products are no longer available in the requested quantity.
            Return to your cart to update them.
          </p>
        )}

        {orderError && (
          <p className="mt-4 text-sm text-danger" role="alert">
            {orderError}
          </p>
        )}

        <button
          type="button"
          onClick={placeOrder}
          disabled={isPlacingOrder || hasStockIssue}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPlacingOrder ? "Placing order..." : "Place order"}
        </button>
      </div>
    </div>
  );
}
