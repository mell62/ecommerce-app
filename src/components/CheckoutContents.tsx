"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { calculateOrderPricing, ESTIMATED_TAX_RATE } from "@/lib/pricing";
import CheckoutSummarySkeleton from "@/components/CheckoutSummarySkeleton";

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
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const pricing = calculateOrderPricing(subtotal);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
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
    return <CheckoutSummarySkeleton />;
  }

  if (loadError) {
    return (
      <div className="max-w-3xl">
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
      <div className="max-w-3xl">
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section className="rounded-ui border border-border bg-surface p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Your products
            </h2>
            <p className="mt-1 text-sm text-muted">
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"} ready to
              order
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex min-h-10 items-center justify-center rounded-ui px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Edit cart
          </Link>
        </div>

        <div className="divide-y divide-border">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex items-center gap-4 py-5 last:pb-1"
            >
              <Link
                href={`/products/${item.id}`}
                className="group relative isolate flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-ui border border-border/70 bg-surface p-1 before:absolute before:inset-[16%] before:rounded-full before:bg-brand-100/65 before:blur-lg sm:size-24 sm:p-1.5"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={96}
                  height={96}
                  sizes="(min-width: 640px) 96px, 80px"
                  className="relative z-10 h-full w-full object-contain drop-shadow-lg transition-transform duration-300 ease-[var(--store-ease-emphasized)] group-hover:scale-[1.03]"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.id}`}
                  className="font-display font-semibold text-foreground hover:text-brand-700"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  Quantity {item.quantity} <span aria-hidden="true">·</span> $
                  {item.price.toFixed(2)} each
                </p>
                {item.price !== item.originalPrice && (
                  <p className="mt-1 text-xs font-medium text-brand-700">
                    {item.discountPercent}% discount applied
                  </p>
                )}
              </div>

              <p className="shrink-0 self-start pt-1 font-semibold text-foreground">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <aside className="rounded-ui border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Order summary
        </h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Items</dt>
            <dd>{totalQuantity}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Subtotal</dt>
            <dd>${pricing.subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Shipping</dt>
            <dd>
              {pricing.shippingCost === 0
                ? "Free"
                : `$${pricing.shippingCost.toFixed(2)}`}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Estimated tax ({ESTIMATED_TAX_RATE * 100}%)</dt>
            <dd>${pricing.estimatedTax.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4 text-lg font-bold text-foreground">
            <dt>Estimated total</dt>
            <dd>${pricing.total.toFixed(2)}</dd>
          </div>
        </dl>

        {hasStockIssue && (
          <div
            className="mt-5 rounded-ui border border-danger/25 bg-danger/5 p-3 text-sm text-danger"
            role="alert"
          >
            <p>Some quantities are no longer available.</p>
            <Link href="/cart" className="mt-1 inline-block font-semibold">
              Return to cart
            </Link>
          </div>
        )}

        {orderError && (
          <p
            className="mt-5 rounded-ui border border-danger/25 bg-danger/5 p-3 text-sm text-danger"
            role="alert"
          >
            {orderError}
          </p>
        )}

        <button
          type="button"
          onClick={placeOrder}
          disabled={isPlacingOrder || hasStockIssue}
          aria-busy={isPlacingOrder}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isPlacingOrder && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
            />
          )}
          {isPlacingOrder ? "Placing order..." : "Place order"}
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-muted">
          Pricing is recalculated securely when you place the order.
        </p>
      </aside>
    </div>
  );
}
