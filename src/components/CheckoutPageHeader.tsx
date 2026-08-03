import Link from "next/link";

export default function CheckoutPageHeader() {
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/cart" className="hover:text-brand-700">
              Cart
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            Checkout
          </li>
        </ol>
      </nav>

      <header className="mb-8 max-w-2xl sm:mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Final review
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Checkout
        </h1>
        <p className="mt-3 text-base leading-7 text-muted sm:text-lg">
          Confirm your products and pricing before placing the order.
        </p>
      </header>
    </>
  );
}
