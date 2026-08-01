import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Image from "next/image";
import Link from "next/link";
import ReviewForm from "@/components/ReviewForm";
import { getDiscountedPrice, hasDiscount } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/session";
import DeleteReviewButton from "@/components/DeleteReviewButton";
import EditReviewButton from "@/components/EditReviewButton";
import WishlistButton from "@/components/WishlistButton";
import ProductImageZoom from "@/components/ProductImageZoom";
import { getRandomReviewPlaceholder } from "@/lib/review-prompts";
import StarRatingDisplay from "@/components/StarRatingDisplay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProductPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ProductPage({ params }: ProductPageProps) {
  const id = (await params).id;

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      reviews: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const user = await getCurrentUser();

  if (!product) {
    return notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      category: product.category,
      NOT: {
        id: product.id,
      },
    },
    take: 3,
    orderBy: {
      createdAt: "desc",
    },
  });

  const reviewCount = product.reviews.length;

  const averageRating =
    reviewCount === 0
      ? 0
      : product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount;

  const productHasDiscount = hasDiscount(product.discountPercent);

  const discountedPrice = getDiscountedPrice(
    product.price,
    product.discountPercent
  );

  const hasReviewed = product.reviews.some(
    (review) => review.userId === user?.id
  );
  const reviewPlaceholder = getRandomReviewPlaceholder();

  return (
    <main className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-8 sm:py-10 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link className="hover:text-brand-700" href="/products">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              className="hover:text-brand-700"
              href={`/products?category=${encodeURIComponent(product.category)}`}
            >
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      <section
        aria-labelledby="product-title"
        className="grid gap-8 min-[75rem]:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] min-[75rem]:items-center min-[75rem]:gap-12"
      >
        <div className="relative isolate mx-auto flex aspect-[4/3] w-full max-w-[36rem] items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-brand-100/90 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-[5%] left-1/2 -z-10 h-8 w-2/3 -translate-x-1/2 rounded-[50%] bg-foreground/15 blur-2xl"
          />

          <ProductImageZoom src={product.imageUrl} alt={product.name} />
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            {product.category}
          </p>
          <h1
            id="product-title"
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            {product.name}
          </h1>

          {productHasDiscount && (
            <span className="mt-4 inline-block rounded-ui bg-deal/10 px-3 py-1 text-sm font-semibold text-deal">
              {product.discountPercent}% off · Deal price
            </span>
          )}

          <div className="mt-4">
            {reviewCount === 0 ? (
              <p className="text-gray-600">No ratings yet</p>
            ) : (
              <p className="text-gray-700">
                ⭐ {averageRating.toFixed(1)} / 5 ({reviewCount}{" "}
                {reviewCount === 1 ? "review" : "reviews"})
              </p>
            )}
          </div>

          <p className="mt-5 text-base leading-7 text-muted sm:text-lg">
            {product.description}
          </p>

          {productHasDiscount ? (
            <div className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                ${discountedPrice.toFixed(2)}
              </p>

              <p className="text-base text-muted line-through">
                ${product.price.toFixed(2)}
              </p>

              <p className="w-full text-sm font-semibold text-deal">
                Save ${(product.price - discountedPrice).toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="mt-7 text-3xl font-bold tracking-tight text-foreground">
              ${product.price.toFixed(2)}
            </p>
          )}

          <div className="mt-5 flex items-center gap-2 border-y border-border py-3 text-sm font-semibold">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                product.stockCount === 0
                  ? "bg-danger"
                  : product.stockCount <= 10
                    ? "bg-warning"
                    : "bg-success"
              }`}
            />
            {product.stockCount === 0 ? (
              <p className="text-danger">Out of stock</p>
            ) : product.stockCount <= 10 ? (
              <p className="text-warning">Only {product.stockCount} left</p>
            ) : (
              <p className="text-success">In stock</p>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-start gap-3">
            <AddToCartButton product={product} />
            <div className="mt-6">
              <WishlistButton product={product} />
            </div>
          </div>
        </div>
      </section>
      {user ? (
        hasReviewed ? (
          <div className="mt-10 flex max-w-3xl items-start gap-4 rounded-ui border border-brand-100 bg-brand-50/60 p-5 sm:p-6">
            <span
              aria-hidden="true"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand-700 shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m5 12.5 4.2 4.2L19 7"
                />
              </svg>
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                Your review is published
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                You can edit or delete it from the customer feedback below.
              </p>
              <Link
                href="#reviews"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600"
              >
                View your review
                <span aria-hidden="true">↓</span>
              </Link>
            </div>
          </div>
        ) : (
          <ReviewForm
            productId={product.id}
            reviewPlaceholder={reviewPlaceholder}
          />
        )
      ) : (
        <div className="rounded border p-4">
          <p className="mb-3 text-gray-700">Log in to leave a review.</p>

          <Link
            href={`/login?redirect=/products/${product.id}`}
            className="inline-block rounded bg-black px-4 py-2 text-white"
          >
            Log In to Review
          </Link>
        </div>
      )}
      <section
        id="reviews"
        aria-labelledby="reviews-heading"
        className="mt-12 max-w-3xl border-t border-border pt-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
              Customer feedback
            </p>
            <h2
              id="reviews-heading"
              className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl"
            >
              Reviews
            </h2>
          </div>

          <p className="text-sm text-muted">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>

        {product.reviews.length === 0 ? (
          <div className="mt-6 rounded-ui border border-dashed border-border bg-surface p-6 text-center">
            <p className="font-semibold text-foreground">No reviews yet</p>
            <p className="mt-1 text-sm text-muted">
              Be the first customer to share an experience with this product.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {product.reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-ui border border-border bg-surface p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display font-semibold uppercase text-brand-700"
                    >
                      {review.name.charAt(0)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {review.name}
                        </p>
                        {user?.id === review.userId && (
                          <span className="rounded-ui bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                            Your review
                          </span>
                        )}
                      </div>
                      <time
                        dateTime={review.createdAt.toISOString()}
                        className="text-xs text-muted"
                      >
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(review.createdAt)}
                      </time>
                    </div>
                  </div>

                  <StarRatingDisplay rating={review.rating} />
                </div>

                <p className="mt-4 break-words whitespace-pre-wrap leading-7 text-muted">
                  {review.comment}
                </p>

                {user?.id === review.userId && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4">
                    <EditReviewButton
                      reviewId={review.id}
                      initialRating={review.rating}
                      initialComment={review.comment}
                    />
                    <DeleteReviewButton reviewId={review.id} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Related Products</h2>

        {relatedProducts.length === 0 ? (
          <p className="text-gray-600">No related products found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => {
              const relatedProductHasDiscount = hasDiscount(
                relatedProduct.discountPercent
              );

              const relatedProductDiscountedPrice = getDiscountedPrice(
                relatedProduct.price,
                relatedProduct.discountPercent
              );

              return (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.id}`}
                  className="border rounded-lg p-4 shadow hover:shadow-lg transition block"
                >
                  {relatedProductHasDiscount && (
                    <div className="mb-2">
                      <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        {relatedProduct.discountPercent}% OFF
                      </span>
                    </div>
                  )}
                  <Image
                    src={relatedProduct.imageUrl}
                    alt={relatedProduct.name}
                    width={800}
                    height={600}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="w-full h-40 object-cover rounded"
                  />

                  <h3 className="font-semibold mt-4">{relatedProduct.name}</h3>

                  {relatedProductHasDiscount ? (
                    <div className="mt-2">
                      <p className="font-bold">
                        ${relatedProductDiscountedPrice.toFixed(2)}
                      </p>

                      <p className="text-sm text-gray-500 line-through">
                        ${relatedProduct.price.toFixed(2)}
                      </p>

                      <p className="text-sm text-green-700">
                        {relatedProduct.discountPercent}% off
                      </p>
                    </div>
                  ) : (
                    <p className="font-bold mt-2">
                      ${relatedProduct.price.toFixed(2)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
