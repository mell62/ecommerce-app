import type { Metadata } from "next";
import Link from "next/link";

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
    href: null,
    action: null,
  },
] as const;

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-10 sm:py-12 lg:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
        Zeus operations
      </p>
      <h1 className="mt-2 font-display text-[var(--store-text-page-title)] font-semibold tracking-tight text-foreground">
        Admin dashboard
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
        Manage the catalog, inventory, and customer orders from one protected
        workspace.
      </p>

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
