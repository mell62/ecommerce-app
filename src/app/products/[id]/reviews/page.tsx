import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ReviewList from "@/components/ReviewList";
import RatingBreakdown from "@/components/RatingBreakdown";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer reviews" };

export default async function ProductReviewsPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, isArchived: false },
    include: { reviews: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] } },
  });
  if (!product) notFound();
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-8 sm:py-10 lg:py-12">
      <Link
        href={`/products/${id}#reviews`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
      >
        Back to product
      </Link>
      <header className="mb-8 mt-5">
        <p className="text-sm font-semibold text-brand-700">{product.name}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Customer reviews
        </h1>
        <p className="mt-3 text-sm text-muted">
          {product.reviews.length} reviews · Most recent first
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <div className="min-w-0">
          {product.reviews.length ? (
            <ReviewList reviews={product.reviews} userId={user?.id} />
          ) : (
            <p className="rounded-ui border border-dashed border-border p-6 text-muted">
              No reviews yet. Share your experience on the product page.
            </p>
          )}
        </div>
        <aside className="order-first min-w-0 lg:order-none lg:sticky lg:top-24">
          <RatingBreakdown reviews={product.reviews} />
        </aside>
      </div>
    </div>
  );
}
