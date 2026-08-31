"use client";

import { useEffect } from "react";
import Link from "next/link";
import WishlistPageHeader from "@/components/WishlistPageHeader";

type WishlistErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function WishlistError({ error, reset }: WishlistErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-8 sm:py-10 lg:py-12">
      <WishlistPageHeader />

      <section
        className="rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Wishlist unavailable
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          We couldn&apos;t open your wishlist
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Something interrupted this page. Try loading it again, or continue
          browsing products while the issue is resolved.
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
            Browse products
          </Link>
        </div>
      </section>
    </main>
  );
}
