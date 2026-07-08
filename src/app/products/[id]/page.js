import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";
import ReviewForm from "@/components/ReviewForm";

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

  const hasDiscount = product.discountPercent > 0;

  const discountedPrice = hasDiscount
    ? product.price - (product.price * product.discountPercent) / 100
    : product.price;

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

          {product.discountPercent > 0 && (
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

          {hasDiscount ? (
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
      <ReviewForm productId={product.id} />
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
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/products/${relatedProduct.id}`}
                className="border rounded-lg p-4 shadow hover:shadow-lg transition block"
              >
                <img
                  src={relatedProduct.imageUrl}
                  alt={relatedProduct.name}
                  className="w-full h-40 object-cover rounded"
                />

                <h3 className="font-semibold mt-4">{relatedProduct.name}</h3>

                <p className="font-bold mt-2">${relatedProduct.price}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
