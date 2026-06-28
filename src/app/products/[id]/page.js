import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProductPage({ params }) {
  const id = (await params).id;

  const product = await prisma.product.findUnique({
    where: {
      id,
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
          <h1 className="text-3xl font-bold">
            {product.name}
          </h1>

          <p className="mt-4 text-gray-600">
            {product.description}
          </p>

          <p className="mt-6 text-2xl font-bold">
            ${product.price}
          </p>

          <p className="mt-2">
            Stock: {product.stockCount}
          </p>

          <button className="mt-6 bg-black text-white px-6 py-3 rounded">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}