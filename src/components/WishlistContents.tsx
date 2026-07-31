"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/components/WishlistProvider";

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
      <div className="rounded-ui border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          Log in to view your wishlist
        </h2>
        <p className="mt-2 text-muted">
          Your saved products will be available anywhere you sign in.
        </p>
        <Link
          href="/login?redirect=/wishlist"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="text-muted" role="status">
        Loading wishlist...
      </p>
    );
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

  if (products.length === 0) {
    return (
      <div className="rounded-ui border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">
          Your wishlist is empty
        </h2>
        <p className="mt-2 text-muted">
          Save products while browsing and they will appear here.
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
