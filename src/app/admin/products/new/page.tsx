import type { Metadata } from "next";
import Link from "next/link";
import AdminProductForm from "@/components/AdminProductForm";

export const metadata: Metadata = {
  title: "Add product",
  description: "Add a product to the Zeus electronics catalog.",
};

export default function NewProductPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-[var(--store-page-gutter)] py-10 sm:py-12 lg:py-16">
      <Link
        href="/admin/products"
        className="inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold text-brand-700 underline decoration-brand-100 decoration-2 underline-offset-4 transition-colors hover:decoration-brand-500"
      >
        Back to products
      </Link>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
        Catalog management
      </p>
      <h1 className="mt-2 font-display text-[var(--store-text-page-title)] font-semibold tracking-tight text-foreground">
        Add a product
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Create a complete catalog listing and set its starting inventory.
      </p>

      <AdminProductForm />
    </div>
  );
}
