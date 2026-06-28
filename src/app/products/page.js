export const dynamic = "force-dynamic";
import Link from "next/link";

async function getProducts() {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/products`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="border rounded-lg p-4 shadow hover:shadow-lg transition block"
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-48 object-cover rounded"
            />

            <h2 className="text-xl font-semibold mt-4">{product.name}</h2>

            <p className="text-gray-600">{product.description}</p>

            <p className="font-bold mt-2">${product.price}</p>

            <p className="text-sm text-gray-500">Stock: {product.stockCount}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
