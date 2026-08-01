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

          <Image
            src={product.imageUrl}
            alt={product.name}
            width={800}
            height={600}
            priority
            sizes="(min-width: 1200px) 55vw, (min-width: 640px) 576px, 100vw"
            className="relative z-10 h-[90%] w-[90%] object-contain drop-shadow-xl"
          />
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
          <p className="rounded border p-4 text-gray-700">
            You have already reviewed this product.
          </p>
        ) : (
          <ReviewForm productId={product.id} />
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
      <div className="mt-10">
        <h2 id="reviews" className="mb-4 text-2xl font-bold">
          Reviews
        </h2>

        {product.reviews.length === 0 ? (
          <p className="text-gray-600">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="border rounded p-4">
                <div className="flex justify-between">
                  <p className="font-semibold">{review.name}</p>
                  <p>{"⭐".repeat(review.rating)}</p>
                </div>

                <p className="mt-2 text-gray-700">{review.comment}</p>
                {user?.id === review.userId && (
                  <EditReviewButton
                    reviewId={review.id}
                    initialRating={review.rating}
                    initialComment={review.comment}
                  />
                )}
                {user?.id === review.userId && (
                  <DeleteReviewButton reviewId={review.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
