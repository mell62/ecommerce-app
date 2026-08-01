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
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
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
        <div className="mt-10 flex max-w-3xl flex-col gap-5 rounded-ui border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M7.5 18.5 4 20l1.1-3.9A7.5 7.5 0 1 1 7.5 18.5Z"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                  d="M8.5 11.5h7M8.5 8.5h4.5"
                />
              </svg>
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                Share your experience
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Log in to rate this product and help other customers decide.
              </p>
            </div>
          </div>

          <Link
            href={`/login?redirect=/products/${product.id}`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
          >
            Log in to review
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
      <section
        aria-labelledby="related-products-heading"
        className="mt-16 border-t border-border pt-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
              Complete your setup
            </p>
            <h2
              id="related-products-heading"
              className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl"
            >
              Related products
            </h2>
          </div>

          <Link
            href={`/products?category=${encodeURIComponent(product.category)}`}
            className="text-sm font-semibold text-brand-700 hover:text-brand-600"
          >
            View all {product.category.toLowerCase()}
          </Link>
        </div>

        {relatedProducts.length === 0 ? (
          <div className="mt-6 rounded-ui border border-dashed border-border bg-surface p-6 text-center">
            <p className="font-semibold text-foreground">
              No related products available
            </p>
            <p className="mt-1 text-sm text-muted">
              Explore the full catalog to find something that fits your setup.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((relatedProduct) => {
              const relatedProductHasDiscount = hasDiscount(
                relatedProduct.discountPercent
              );

              const relatedProductDiscountedPrice = getDiscountedPrice(
                relatedProduct.price,
                relatedProduct.discountPercent
              );
              const relatedReviewCount = relatedProduct.reviews.length;
              const relatedAverageRating =
                relatedReviewCount === 0
                  ? 0
                  : relatedProduct.reviews.reduce(
                      (sum, review) => sum + review.rating,
                      0
                    ) / relatedReviewCount;

              return (
                <article
                  key={relatedProduct.id}
                  className="group flex h-full flex-col overflow-hidden rounded-ui border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-border-hover hover:shadow-card focus-within:border-brand-500 focus-within:shadow-card"
                >
                  <Link
                    href={`/products/${relatedProduct.id}`}
                    className="flex flex-1 flex-col"
                  >
                    <div className="relative overflow-hidden bg-brand-50">
                      <Image
                        src={relatedProduct.imageUrl}
                        alt={relatedProduct.name}
                        width={800}
                        height={600}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />

                      {relatedProductHasDiscount && (
                        <span className="absolute left-3 top-3 rounded-ui bg-deal px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                          {relatedProduct.discountPercent}% off
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {relatedProduct.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                        {relatedProduct.description}
                      </p>

                      {relatedReviewCount > 0 ? (
                        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
                          <span aria-hidden="true" className="text-warning">
                            ★
                          </span>
                          <span>
                            {relatedAverageRating.toFixed(1)}
                            <span className="text-muted">
                              {" "}
                              · {relatedReviewCount}{" "}
                              {relatedReviewCount === 1 ? "review" : "reviews"}
                            </span>
                          </span>
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-muted">
                          No reviews yet
                        </p>
                      )}

                      {relatedProductHasDiscount ? (
                        <div className="mt-auto flex items-baseline gap-2 pt-4">
                          <p className="text-lg font-bold text-foreground">
                            ${relatedProductDiscountedPrice.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted line-through">
                            ${relatedProduct.price.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-auto pt-4 text-lg font-bold text-foreground">
                          ${relatedProduct.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="border-t border-border px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      {relatedProduct.stockCount === 0 ? (
                        <p className="text-sm font-semibold text-danger">
                          Out of stock
                        </p>
                      ) : relatedProduct.stockCount <= 10 ? (
                        <p className="text-sm font-semibold text-warning">
                          Only {relatedProduct.stockCount} left
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-success">
                          In stock
                        </p>
                      )}

                      <WishlistButton product={relatedProduct} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
