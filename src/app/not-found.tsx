import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested page could not be found on Zeus Electronics.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[var(--store-container)] items-center px-[var(--store-page-gutter)] py-10 sm:py-12 lg:py-16">
      <section
        aria-labelledby="not-found-heading"
        className="relative w-full overflow-hidden rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8 lg:p-10"
      >
        <div
          aria-hidden="true"
          className="absolute -right-8 -top-16 font-display text-[10rem] font-bold leading-none tracking-tighter text-brand-50 sm:right-4 sm:text-[14rem]"
        >
          404
        </div>

        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            404 · Lost signal
          </p>
          <h1
            id="not-found-heading"
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            This page isn&apos;t connected
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            The link may be outdated, or the product may no longer be
            available. Return home or continue exploring the Zeus catalog.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
            >
              Browse products
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border bg-surface px-5 py-2.5 font-semibold text-foreground hover:-translate-y-0.5 hover:border-border-hover hover:text-brand-700 hover:shadow-sm"
            >
              Return home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
