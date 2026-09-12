import { PaymentStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Manage the Zeus product catalog, inventory, and orders.",
};

const adminAreas = [
  {
    title: "Products & Inventory",
    description:
      "Maintain the Zeus catalog, review pricing, and monitor stock levels.",
    href: "/admin/products",
    action: "Manage catalog",
  },
  {
    title: "Orders",
    description: "Review customer orders and update their fulfillment status.",
    href: "/admin/orders",
    action: "Manage orders",
  },
] as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function AdminPage() {
  const [productCount, lowStockCount, fulfillmentCount, paidRevenue] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          stockCount: {
            lte: 10,
          },
        },
      }),
      prisma.order.count({
        where: {
          paymentStatus: PaymentStatus.PAID,
          status: {
            in: ["PROCESSING", "SHIPPED"],
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.PAID,
        },
        _sum: {
          totalPrice: true,
        },
      }),
    ]);

  const summaries = [
    {
      label: "Catalog products",
      value: productCount.toLocaleString("en-US"),
      detail: "Across the active catalog",
      href: "/admin/products",
    },
    {
      label: "Low stock",
      value: lowStockCount.toLocaleString("en-US"),
      detail: "Products with 10 or fewer units",
      href: "/admin/products?stock=low",
    },
    {
      label: "Awaiting fulfillment",
      value: fulfillmentCount.toLocaleString("en-US"),
      detail: "Paid orders still in progress",
      href: "/admin/orders?view=fulfillment",
    },
    {
      label: "Paid revenue",
      value: currencyFormatter.format(paidRevenue._sum.totalPrice ?? 0),
      detail: "From successfully paid orders",
      href: "/admin/orders",
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-10 sm:py-12 lg:py-16">
      <p className="flex items-baseline gap-1">
        <span className="font-display text-base font-bold tracking-tight text-foreground">
          Zeus
        </span>
        <span className="text-sm font-semibold uppercase tracking-wider text-brand-700">
          Operations
        </span>
      </p>
      <h1 className="mt-2 font-display text-[var(--store-text-page-title)] font-semibold tracking-tight text-foreground">
        Admin dashboard
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
        Manage the catalog, inventory, and customer orders from one protected
        workspace.
      </p>

      <section className="mt-8" aria-labelledby="operations-overview-heading">
        <h2
          id="operations-overview-heading"
          className="font-display text-xl font-semibold text-foreground"
        >
          Operations overview
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaries.map((summary) => (
            <div
              key={summary.label}
              className="rounded-ui border border-border bg-surface p-4 shadow-sm"
            >
              <dt className="text-sm font-medium text-muted">
                {summary.label}
              </dt>
              <dd className="mt-2">
                <span className="block font-display text-2xl font-semibold tracking-tight text-foreground">
                  {summary.value}
                </span>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {summary.detail}
                </p>
                <Link
                  href={summary.href}
                  className="mt-3 inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold text-brand-700 underline decoration-brand-100 decoration-2 underline-offset-4 transition-colors hover:decoration-brand-500"
                >
                  View {summary.label.toLowerCase()}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {adminAreas.map((area) => (
          <section
            key={area.title}
            className="rounded-ui border border-border bg-surface p-5 shadow-sm"
          >
            <h2 className="font-display text-xl font-semibold text-foreground">
              {area.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {area.description}
            </p>
            {area.href && area.action ? (
              <Link
                href={area.href}
                className="mt-5 inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold text-brand-700 underline decoration-brand-100 decoration-2 underline-offset-4 transition-colors hover:decoration-brand-500"
              >
                {area.action}
              </Link>
            ) : (
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                Coming next
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
