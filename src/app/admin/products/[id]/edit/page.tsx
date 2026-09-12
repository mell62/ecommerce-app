import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminProductForm from "@/components/AdminProductForm";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Edit product",
  description: "Update a product in the Zeus electronics catalog.",
};

type EditProductPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const productId = (await params).id;
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      imageUrl: true,
      price: true,
      stockCount: true,
      discountPercent: true,
      isFeatured: true,
      isNew: true,
      isBestSeller: true,
    },
  });

  if (!product) {
    notFound();
  }

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
        Edit {product.name}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Update the catalog listing and current inventory for this product.
      </p>

      <AdminProductForm product={product} />
    </div>
  );
}
