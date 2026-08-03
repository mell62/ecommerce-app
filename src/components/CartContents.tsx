"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { calculateOrderPricing, ESTIMATED_TAX_RATE } from "@/lib/pricing";

function CartLoadingSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      role="status"
      aria-label="Loading cart"
    >
      <span className="sr-only">Loading cart...</span>

      <div className="space-y-4" aria-hidden="true">
        {[1, 2].map((skeletonItem) => (
          <div
            key={skeletonItem}
            className="flex animate-pulse flex-col gap-4 rounded-ui border border-border bg-surface p-4 sm:flex-row"
          >
            <div className="aspect-[4/3] w-full rounded-ui bg-surface-muted sm:w-40 sm:shrink-0" />
            <div className="flex flex-1 flex-col py-1">
              <div className="h-5 w-2/3 rounded bg-surface-muted" />
              <div className="mt-4 h-11 w-36 rounded-ui bg-surface-muted" />
              <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                <div className="h-5 w-20 rounded bg-surface-muted" />
                <div className="h-10 w-20 rounded-ui bg-surface-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="animate-pulse rounded-ui border border-border bg-surface p-5"
      >
        <div className="h-5 w-28 rounded bg-surface-muted" />
        <div className="mt-5 h-px bg-border" />
        <div className="mt-5 h-12 w-full rounded-ui bg-surface-muted" />
      </div>
    </div>
  );
}

export default function CartContents() {
  const {
    items,
    isAuthenticated,
    isLoading,
    loadError,
    updateQuantity,
    removeProduct,
  } = useCart();
  const [updatingProductId, setUpdatingProductId] = useState("");
  const [error, setError] = useState("");

  async function changeQuantity(
    productId: string,
    nextQuantity: number
  ): Promise<void> {
    setError("");
    setUpdatingProductId(productId);

    try {
      if (nextQuantity < 1) {
        await removeProduct(productId);
      } else {
        await updateQuantity(productId, nextQuantity);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update cart."
      );
    } finally {
      setUpdatingProductId("");
    }
  }

  async function removeItem(productId: string): Promise<void> {
    setError("");
    setUpdatingProductId(productId);

    try {
      await removeProduct(productId);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to remove product from cart."
      );
    } finally {
      setUpdatingProductId("");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-ui border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          Log in to view your cart
        </h2>
        <p className="mt-2 text-muted">
          Your cart will stay available anywhere you sign in.
        </p>
        <Link
          href="/login?redirect=/cart"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <CartLoadingSkeleton />;
  }

  if (loadError) {
    return (
      <div
        className="rounded-ui border border-border bg-surface p-6"
        role="alert"
      >
        <p className="font-semibold text-danger">{loadError}</p>
        <p className="mt-2 text-muted">Refresh the page to try again.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-ui border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          Your cart is empty
        </h2>
        <p className="mt-2 text-muted">
          Explore the catalog and add something that fits your setup.
        </p>
        <Link
          href="/products"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const pricing = calculateOrderPricing(subtotal);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasStockIssue = items.some(
    (item) => item.stockCount === 0 || item.quantity > item.stockCount
  );

  return (
    <div>
      <p className="mb-5 text-sm font-medium text-muted" aria-live="polite">
        {items.length} {items.length === 1 ? "product" : "products"} in your
        cart
      </p>

      {error && (
        <p
          className="mb-5 rounded-ui border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-4">
          {items.map((item) => {
            const isUpdating = updatingProductId === item.id;

            return (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-ui border border-border bg-surface p-4 shadow-sm sm:flex-row sm:p-5"
              >
                <Link
                  href={`/products/${item.id}`}
                  className="flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-ui bg-brand-50 p-2 sm:w-40"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={160}
                    height={120}
                    sizes="(min-width: 640px) 160px, 100vw"
                    className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link
                      href={`/products/${item.id}`}
                      className="w-fit font-display text-lg font-semibold text-foreground hover:text-brand-700"
                    >
                      {item.name}
                    </Link>
                    <p className="font-bold text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <p className="mt-1 text-sm text-muted">
                    ${item.price.toFixed(2)} each
                    {item.price !== item.originalPrice && (
                      <span className="ml-2 line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Quantity
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(item.id, item.quantity - 1)
                        }
                        disabled={isUpdating || item.quantity <= 1}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="inline-flex size-11 items-center justify-center rounded-ui border border-border bg-surface font-semibold hover:border-border-hover hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        −
                      </button>
                      <span
                        className="min-w-8 text-center font-semibold"
                        aria-live="polite"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(item.id, item.quantity + 1)
                        }
                        disabled={
                          isUpdating || item.quantity >= item.stockCount
                        }
                        aria-label={`Increase ${item.name} quantity`}
                        className="inline-flex size-11 items-center justify-center rounded-ui border border-border bg-surface font-semibold hover:border-border-hover hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {item.stockCount === 0 ? (
                    <p className="mt-2 text-sm font-medium text-danger">
                      This product is out of stock.
                    </p>
                  ) : item.quantity > item.stockCount ? (
                    <p className="mt-2 text-sm font-medium text-danger">
                      Only {item.stockCount} available.
                    </p>
                  ) : item.quantity === item.stockCount ? (
                    <p className="mt-2 text-sm font-medium text-warning">
                      Maximum available quantity reached.
                    </p>
                  ) : null}

                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isUpdating}
                      className="inline-flex min-h-10 items-center justify-center rounded-ui px-2 text-sm font-semibold text-muted hover:bg-danger/5 hover:text-danger disabled:cursor-wait disabled:opacity-60"
                    >
                      {isUpdating ? "Updating..." : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="rounded-ui border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Order summary
          </h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 text-muted">
              <dt>Items</dt>
              <dd>{totalQuantity}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4 text-lg font-bold text-foreground">
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

          <div className="mt-4 rounded-ui bg-brand-50 p-3">
            <p className="text-sm font-semibold text-brand-700">
              {pricing.qualifiesForFreeShipping
                ? "Free shipping unlocked."
                : `Add $${pricing.amountUntilFreeShipping.toFixed(2)} more for free shipping.`}
            </p>
            <div
              aria-hidden="true"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100"
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-[var(--store-ease-emphasized)]"
                style={{
                  width: `${Math.min(
                    100,
                    (pricing.subtotal /
                      (pricing.subtotal + pricing.amountUntilFreeShipping)) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>

          {hasStockIssue ? (
            <>
              <p className="mt-4 text-sm text-danger">
                Update unavailable quantities before checkout.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-ui bg-muted px-5 py-2.5 font-semibold text-white"
              >
                Checkout unavailable
              </button>
            </>
          ) : (
            <Link
              href="/checkout"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
            >
              Continue to checkout
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
