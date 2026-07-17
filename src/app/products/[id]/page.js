import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";
import ReviewForm from "@/components/ReviewForm";
import { getDiscountedPrice, hasDiscount } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/session";
import DeleteReviewButton from "@/components/DeleteReviewButton";
import EditReviewButton from "@/components/EditReviewButton";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProductPage({ params }) {
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
    <div className="max-w-4xl mx-auto p-8">
      <div className="grid md:grid-cols-2 gap-8">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full rounded-lg"
        />

        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {productHasDiscount && (
            <span className="inline-block mt-3 rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              {product.discountPercent}% OFF
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

          <p className="mt-4 text-gray-600">{product.description}</p>

          {productHasDiscount ? (
            <div className="mt-6">
              <p className="text-2xl font-bold">
                ${discountedPrice.toFixed(2)}
              </p>

              <p className="text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </p>

              <p className="text-sm text-green-700">
                {product.discountPercent}% off
              </p>
            </div>
          ) : (
            <p className="mt-6 text-2xl font-bold">
              ${product.price.toFixed(2)}
            </p>
          )}

          {product.stockCount === 0 ? (
            <p className="mt-2 text-red-600 font-medium">Out of stock</p>
          ) : product.stockCount <= 10 ? (
            <p className="mt-2 text-orange-600 font-medium">
              Only {product.stockCount} left
            </p>
          ) : (
            <p className="mt-2 text-green-600 font-medium">In stock</p>
          )}

          <AddToCartButton product={product} />
        </div>
      </div>
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
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>

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
                  <img
                    src={relatedProduct.imageUrl}
                    alt={relatedProduct.name}
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
    </div>
  );
}
