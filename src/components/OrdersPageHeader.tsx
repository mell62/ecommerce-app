import Link from "next/link";

export default function OrdersPageHeader() {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Zeus account
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Your orders
        </h1>
        <p className="mt-3 text-base leading-7 text-muted sm:text-lg">
          Review your purchases and the products included in each order.
        </p>
      </div>
      <Link
        href="/products"
        className="inline-flex min-h-11 w-fit shrink-0 items-center justify-center rounded-ui border border-border bg-surface px-5 py-2.5 font-semibold text-foreground shadow-sm hover:-translate-y-0.5 hover:border-border-hover hover:text-brand-700 hover:shadow-card"
      >
        Continue shopping
      </Link>
    </header>
  );
}
