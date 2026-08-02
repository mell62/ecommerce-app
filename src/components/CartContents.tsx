"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

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

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
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
        <p className="mb-5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const isUpdating = updatingProductId === item.id;

          return (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-ui border border-border bg-surface p-4 shadow-sm sm:flex-row"
            >
              <Link href={`/products/${item.id}`} className="shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={160}
                  height={120}
                  sizes="(min-width: 640px) 160px, 100vw"
                  className="aspect-[4/3] w-full rounded-ui object-cover sm:w-40"
                />
              </Link>

              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${item.id}`}
                  className="w-fit font-display text-lg font-semibold text-foreground hover:text-brand-700"
                >
                  {item.name}
                </Link>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, item.quantity - 1)}
                    disabled={isUpdating}
                    aria-label={`Decrease ${item.name} quantity`}
                    className="inline-flex size-11 items-center justify-center rounded-ui border border-border bg-surface font-semibold hover:border-border-hover hover:text-brand-700 disabled:cursor-wait disabled:opacity-60"
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
                    onClick={() => changeQuantity(item.id, item.quantity + 1)}
                    disabled={isUpdating || item.quantity >= item.stockCount}
                    aria-label={`Increase ${item.name} quantity`}
                    className="inline-flex size-11 items-center justify-center rounded-ui border border-border bg-surface font-semibold hover:border-border-hover hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    +
                  </button>
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

                <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
                  <div>
                    <p className="font-bold text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    {item.price !== item.originalPrice && (
                      <p className="text-sm text-muted">
                        ${item.price.toFixed(2)} each
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={isUpdating}
                    className="inline-flex min-h-11 items-center justify-center rounded-ui px-3 text-sm font-semibold text-muted hover:bg-danger/5 hover:text-danger disabled:cursor-wait disabled:opacity-60"
                  >
                    {isUpdating ? "Updating..." : "Remove"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-ui border border-border bg-surface p-5 sm:ml-auto sm:max-w-sm">
        <div className="flex items-center justify-between gap-4 text-lg font-bold text-foreground">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
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
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
          >
            Continue to checkout
          </Link>
        )}
      </div>
    </div>
  );
}
