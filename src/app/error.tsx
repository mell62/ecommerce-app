"use client";

import { useEffect } from "react";
import Link from "next/link";

type AppErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div
        className="w-full rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
          Zeus Electronics
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Something interrupted your visit
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          We couldn&apos;t prepare this page right now. Try loading it again, or
          continue browsing the Zeus catalog.
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
      </div>
    </div>
  );
}
