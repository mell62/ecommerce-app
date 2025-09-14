export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }) {
  const id = (await params).id;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) return notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full md:w-1/2 h-80 object-cover rounded-xl shadow"
        />
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-2xl font-semibold text-blue-600">
            ${product.price}
          </p>
          <p className="text-sm mt-2 text-gray-500">
            In stock: {product.stockCount}
          </p>
          <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

async function getProps(props) {
  return props;
}
