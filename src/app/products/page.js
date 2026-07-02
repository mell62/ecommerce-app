export const dynamic = "force-dynamic";
import Link from "next/link";
import SortDropdown from "@/components/SortDropdown";
import ProductFilters from "@/components/ProductFilters";

async function getProducts(category, search, minPrice, maxPrice, sort) {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products`
  );

  if (category) {
    url.searchParams.set("category", category);
  }

  if (search) {
    url.searchParams.set("search", search);
  }

  if (minPrice) {
    url.searchParams.set("minPrice", minPrice);
  }

  if (maxPrice) {
    url.searchParams.set("maxPrice", maxPrice);
  }

  if (sort) {
    url.searchParams.set("sort", sort);
  }

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const category = params.category;
  const search = params.search;
  const minPrice = params.minPrice;
  const maxPrice = params.maxPrice;
  const sort = params.sort;

  const products = await getProducts(
    category,
    search,
    minPrice,
    maxPrice,
    sort
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        {category ? `${category} Products` : "Products"}
      </h1>

      <div className="flex gap-3 mb-6">
        <Link
          href="/products"
          className="border px-4 py-2 rounded hover:bg-gray-100"
        >
          All
        </Link>

        <Link
          href="/products?category=Accessories"
          className="border px-4 py-2 rounded hover:bg-gray-100"
        >
          Accessories
        </Link>

        <Link
          href="/products?category=Monitors"
          className="border px-4 py-2 rounded hover:bg-gray-100"
        >
          Monitors
        </Link>
      </div>

      <ProductFilters />

      <SortDropdown currentSort={sort} />

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
