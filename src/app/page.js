import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: {
      isFeatured: true,
    },
    take: 3,
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  return (
    <div>
      <section className="bg-gray-400">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <h1 className="text-5xl font-bold max-w-2xl">
            Upgrade your setup with premium tech accessories
          </h1>

          <p className="mt-4 text-gray-600 max-w-xl">
            Discover keyboards, mice, monitors, and essentials selected for
            productivity, gaming, and everyday use.
          </p>

          <Link
            href="/products"
            className="inline-block mt-8 bg-black text-white px-6 py-3 rounded"
          >
            Shop Now
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/products?category=Accessories"
            className="border rounded-lg p-6 shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold">Accessories</h3>
            <p className="mt-2 text-gray-600">
              Keyboards, mice, and everyday desk essentials.
            </p>
          </Link>

          <Link
            href="/products?category=Monitors"
            className="border rounded-lg p-6 shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold">Monitors</h3>
            <p className="mt-2 text-gray-600">
              High-refresh displays for gaming and productivity.
            </p>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>

          <Link href="/products" className="text-sm underline">
            View all
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <p className="text-gray-600">No featured products yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
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

                <h3 className="text-xl font-semibold mt-4">{product.name}</h3>

                <p className="text-gray-600">{product.description}</p>

                <p className="font-bold mt-2">${product.price}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
