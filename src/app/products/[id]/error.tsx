"use client";

import { useEffect } from "react";
import Link from "next/link";

type ProductDetailErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ProductDetailError({
  error,
  reset,
}: ProductDetailErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[var(--store-container)] items-center px-[var(--store-page-gutter)] py-10 sm:py-12 lg:py-16">
      <div
        className="w-full rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Zeus product
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          We couldn&apos;t load this product
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Something interrupted this product page. Try loading it again, or
          return to the catalog to continue browsing.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
          >
            Try again
          </button>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border bg-surface px-5 py-2.5 font-semibold text-foreground hover:-translate-y-0.5 hover:border-border-hover hover:text-brand-700 hover:shadow-sm"
          >
            Back to products
          </Link>
        </div>
      </div>
    </main>
  );
}
