import Link from "next/link";

export const dynamic = "force-dynamic";

async function getProducts() {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/products`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <div className="border rounded-xl p-4 shadow hover:shadow-lg transition cursor-pointer">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-gray-600 text-sm">{product.description}</p>
              <p className="mt-2 font-bold text-blue-600">${product.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
