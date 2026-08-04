"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/components/WishlistProvider";

function WishlistLoadingSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
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
  const [removingProductId, setRemovingProductId] = useState("");
  const [removeError, setRemoveError] = useState("");

  async function handleRemove(productId: string): Promise<void> {
    setRemoveError("");
    setRemovingProductId(productId);

    try {
      await removeProduct(productId);
    } catch (error) {
      setRemoveError(
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

  return (
    <>
      <p className="mb-5 text-sm font-medium text-muted" aria-live="polite">
        {products.length}{" "}
        {products.length === 1 ? "saved product" : "saved products"}
      </p>

      {removeError && (
        <p className="mb-5 text-sm text-danger" role="alert">
          {removeError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex flex-col overflow-hidden rounded-ui border border-border bg-surface shadow-sm"
          >
            <Link
              href={`/products/${product.id}`}
              className="flex flex-1 flex-col"
            >
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={800}
                height={600}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="aspect-[4/3] h-auto w-full object-cover"
              />

              <div className="flex flex-1 flex-col p-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {product.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                  {product.description}
                </p>
                <p className="mt-auto pt-4 text-lg font-bold text-foreground">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </Link>

            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => handleRemove(product.id)}
                disabled={removingProductId === product.id}
                className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-border-hover hover:text-danger disabled:cursor-wait disabled:opacity-60"
              >
                {removingProductId === product.id ? "Removing..." : "Remove"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
