"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useWishlist } from "@/components/WishlistProvider";
import { getDiscountedPrice, hasDiscount } from "@/lib/pricing";

function WishlistLoadingSkeleton() {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),21rem))] justify-start gap-5"
      role="status"
      aria-label="Loading wishlist"
    >
      <span className="sr-only">Loading wishlist...</span>

      {[1, 2, 3].map((product) => (
        <div
          key={product}
          aria-hidden="true"
          className="animate-pulse overflow-hidden rounded-ui border border-border bg-surface shadow-sm"
        >
          <div className="aspect-[4/3] bg-surface-muted" />
          <div className="p-5">
            <div className="h-5 w-2/3 rounded bg-surface-muted" />
            <div className="mt-3 h-4 w-full rounded bg-surface-muted" />
            <div className="mt-2 h-4 w-4/5 rounded bg-surface-muted" />
            <div className="mt-5 h-6 w-24 rounded bg-surface-muted" />
          </div>
          <div className="border-t border-border p-4">
            <div className="h-11 w-24 rounded-ui bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WishlistContents() {
  const { products, isAuthenticated, isLoading, loadError, removeProduct } =
    useWishlist();
  const {
    items: cartItems,
    isLoading: isCartLoading,
    addProduct: addProductToCart,
  } = useCart();
  const [removingProductId, setRemovingProductId] = useState("");
  const [addingProductId, setAddingProductId] = useState("");
  const [addedProductId, setAddedProductId] = useState("");
  const [actionError, setActionError] = useState("");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  async function handleAddToCart(productId: string): Promise<void> {
    setActionError("");
    setAddedProductId("");
    setAddingProductId(productId);

    try {
      await addProductToCart(productId);
      setAddedProductId(productId);

      if (feedbackTimer.current) {
        clearTimeout(feedbackTimer.current);
      }

      feedbackTimer.current = setTimeout(() => {
        setAddedProductId("");
      }, 2500);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to add product to cart."
      );
    } finally {
      setAddingProductId("");
    }
  }

  async function handleRemove(productId: string): Promise<void> {
    setActionError("");
    setRemovingProductId(productId);

    try {
      await removeProduct(productId);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to remove product from wishlist."
      );
    } finally {
      setRemovingProductId("");
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Log in to view your wishlist
        </h2>
        <p className="mt-2 max-w-xl leading-7 text-muted">
          Your saved products will be available anywhere you sign in.
        </p>
        <Link
          href="/login?redirect=/wishlist"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
        >
          Log in
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return <WishlistLoadingSkeleton />;
  }

  if (loadError) {
    return (
      <section
        className="rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-danger">
          Wishlist unavailable
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
          We couldn&apos;t load your saved products
        </h2>
        <p className="mt-2 max-w-xl leading-7 text-muted">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
        >
          Try again
        </button>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Your wishlist is empty
        </h2>
        <p className="mt-2 max-w-xl leading-7 text-muted">
          Save products while browsing and they will appear here.
        </p>
        <Link
          href="/products"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
        >
          Browse products
        </Link>
      </section>
    );
  }

  const addedProductName = products.find(
    (product) => product.id === addedProductId
  )?.name;

  return (
    <>
      <p className="mb-5 text-sm font-medium text-muted" aria-live="polite">
        {products.length}{" "}
        {products.length === 1 ? "saved product" : "saved products"}
      </p>

      {actionError && (
        <p
          className="mb-5 rounded-ui border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {actionError}
        </p>
      )}

      {addedProductName && (
        <p className="sr-only" role="status">
          {addedProductName} added to cart.
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),21rem))] justify-start gap-5">
        {products.map((product) => {
          const productHasDiscount = hasDiscount(product.discountPercent);
          const displayedPrice = getDiscountedPrice(
            product.price,
            product.discountPercent
          );
          const isRemoving = removingProductId === product.id;
          const isAdding = addingProductId === product.id;
          const wasAdded = addedProductId === product.id;
          const cartItem = cartItems.find((item) => item.id === product.id);
          const isAtCartLimit = (cartItem?.quantity ?? 0) >= product.stockCount;
          const isAddDisabled =
            product.stockCount === 0 ||
            isAtCartLimit ||
            isCartLoading ||
            isAdding ||
            isRemoving ||
            wasAdded;
          const addLabel =
            product.stockCount === 0
              ? "Out of stock"
              : isCartLoading
                ? "Loading cart..."
                : isAdding
                  ? "Adding..."
                  : wasAdded
                    ? "Added to cart"
                    : isAtCartLimit
                      ? "Cart limit reached"
                      : "Add to cart";

          return (
            <article
              key={product.id}
              className="group flex h-full flex-col overflow-hidden rounded-ui border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-border-hover hover:shadow-card focus-within:border-brand-500 focus-within:shadow-card"
            >
              <Link
                href={`/products/${product.id}`}
                className="relative isolate flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-border bg-surface p-4 before:absolute before:inset-[24%] before:rounded-full before:bg-brand-100/65 before:blur-2xl sm:p-5"
              >
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={800}
                  height={600}
                  sizes="(min-width: 640px) 336px, calc(100vw - 2rem)"
                  className="relative z-10 h-full w-full object-contain drop-shadow-xl transition-transform duration-300 ease-[var(--store-ease-emphasized)] group-hover:scale-[1.025]"
                />

                {productHasDiscount && (
                  <span className="absolute left-3 top-3 z-20 rounded-ui bg-deal px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                    {product.discountPercent}% off
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col p-5">
                <Link
                  href={`/products/${product.id}`}
                  className="w-fit font-display text-lg font-semibold text-foreground hover:text-brand-700"
                >
                  {product.name}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                  {product.description}
                </p>

                <div className="mt-auto pt-5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-xl font-bold text-foreground">
                      ${displayedPrice.toFixed(2)}
                    </p>
                    {productHasDiscount && (
                      <p className="text-sm text-muted line-through">
                        ${product.price.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {product.stockCount === 0 ? (
                    <p className="mt-2 text-sm font-medium text-danger">
                      Out of stock
                    </p>
                  ) : product.stockCount <= 5 ? (
                    <p className="mt-2 text-sm font-medium text-warning">
                      Only {product.stockCount} left
                    </p>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-success">
                      In stock
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t border-border p-4">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product.id)}
                  disabled={isAddDisabled}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-ui bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isAdding && (
                    <span
                      aria-hidden="true"
                      className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                    />
                  )}
                  {wasAdded && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="size-4"
                    >
                      <path d="m5.5 10 3 3 6-6" />
                    </svg>
                  )}
                  {addLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  disabled={isRemoving || isAdding}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-ui border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground hover:border-danger/40 hover:bg-danger/5 hover:text-danger disabled:cursor-wait disabled:opacity-60"
                >
                  {isRemoving && (
                    <span
                      aria-hidden="true"
                      className="size-4 animate-spin rounded-full border-2 border-muted/35 border-t-current motion-reduce:animate-none"
                    />
                  )}
                  {isRemoving ? "Removing..." : "Remove"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
