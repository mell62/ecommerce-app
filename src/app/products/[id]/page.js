import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";

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

          <p className="mt-4 text-gray-600">{product.description}</p>

          <p className="mt-6 text-2xl font-bold">${product.price}</p>

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
    </div>
  );
}
