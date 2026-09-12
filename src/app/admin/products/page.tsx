import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Manage products",
  description: "Review the Zeus product catalog and current inventory.",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function getStockDetails(stockCount: number): {
  label: string;
  className: string;
} {
  if (stockCount === 0) {
    return {
      label: "Out of stock",
      className: "border-danger/25 bg-danger/5 text-danger",
    };
  }

  if (stockCount <= 10) {
    return {
      label: `${stockCount} in stock · Low`,
      className: "border-warning/25 bg-warning/5 text-warning",
    };
  }

  return {
    label: `${stockCount} in stock`,
    className: "border-success/25 bg-success/5 text-success",
  };
}

type AdminProductsPageProps = Readonly<{
  searchParams: Promise<{
    created?: string | string[];
  }>;
}>;

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const wasCreated =
    (Array.isArray(resolvedSearchParams.created)
      ? resolvedSearchParams.created[0]
      : resolvedSearchParams.created) === "true";
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      imageUrl: true,
      price: true,
      stockCount: true,
      discountPercent: true,
      isFeatured: true,
      isNew: true,
      isBestSeller: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-10 sm:py-12 lg:py-16">
      <Link
        href="/admin"
        className="inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold text-brand-700 underline decoration-brand-100 decoration-2 underline-offset-4 transition-colors hover:decoration-brand-500"
      >
        Back to dashboard
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            Catalog management
          </p>
          <h1 className="mt-2 font-display text-[var(--store-text-page-title)] font-semibold tracking-tight text-foreground">
            Products and inventory
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Review product information and spot stock levels that need
            attention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex min-h-[var(--store-touch-target)] items-center justify-center rounded-ui bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
          >
            Add product
          </Link>
        </div>
      </div>

      {wasCreated && (
        <p
          className="mt-6 rounded-ui border border-success/25 bg-success/5 px-4 py-3 text-sm font-medium text-success"
          role="status"
        >
          Product created successfully.
        </p>
      )}

      {products.length === 0 ? (
        <section className="mt-8 rounded-ui border border-dashed border-border bg-surface px-5 py-10 text-center">
          <h2 className="font-display text-xl font-semibold text-foreground">
            No products yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Products added to the catalog will appear here with their current
            inventory.
          </p>
        </section>
      ) : (
        <ul className="mt-8 grid gap-4" aria-label="Product inventory">
          {products.map((product) => {
            const stock = getStockDetails(product.stockCount);
            const labels = [
              product.isFeatured ? "Featured" : null,
              product.isNew ? "New" : null,
              product.isBestSeller ? "Best seller" : null,
            ].filter((label): label is string => Boolean(label));

            return (
              <li
                key={product.id}
                className="grid gap-4 rounded-ui border border-border bg-surface p-4 shadow-sm sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center sm:p-5"
              >
                <div className="relative aspect-square w-24 overflow-hidden rounded-ui bg-surface-muted">
                  <Image
                    src={product.imageUrl}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-contain p-2"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      {product.name}
                    </h2>
                    {labels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-muted">{product.category}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">
                      {currencyFormatter.format(product.price)}
                    </span>
                    {product.discountPercent > 0 && (
                      <span className="text-deal">
                        {product.discountPercent}% discount
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-right">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${stock.className}`}
                  >
                    {stock.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
