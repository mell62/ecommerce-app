export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import SortDropdown from "@/components/SortDropdown";
import ProductFilters from "@/components/ProductFilters";
import WishlistButton from "@/components/WishlistButton";
import { getDiscountedPrice, hasDiscount } from "@/lib/pricing";

type ProductsPageProps = Readonly<{
  searchParams: Promise<{
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    minRating?: string;
    deals?: string;
  }>;
}>;

type ProductReview = {
  rating: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stockCount: number;
  discountPercent: number;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  reviews: ProductReview[];
};

const categoryLinks = [
  {
    label: "All",
    href: "/products",
    category: undefined,
    deals: false,
  },
  {
    label: "Accessories",
    href: "/products?category=Accessories",
    category: "Accessories",
    deals: false,
  },
  {
    label: "Monitors",
    href: "/products?category=Monitors",
    category: "Monitors",
    deals: false,
  },
  {
    label: "Deals",
    href: "/products?deals=true",
    category: undefined,
    deals: true,
  },
] as const;

async function getProducts(
  category?: string,
  search?: string,
  minPrice?: string,
  maxPrice?: string,
  sort?: string,
  minRating?: string,
  deals?: string
): Promise<Product[]> {
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

  if (minRating) {
    url.searchParams.set("minRating", minRating);
  }

  if (deals) {
    url.searchParams.set("deals", deals);
  }

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const category = params.category;
  const search = params.search;
  const minPrice = params.minPrice;
  const maxPrice = params.maxPrice;
  const sort = params.sort;
  const minRating = params.minRating;
  const deals = params.deals;

  const products = await getProducts(
    category,
    search,
    minPrice,
    maxPrice,
    sort,
    minRating,
    deals
  );

  const pageTitle =
    deals === "true"
      ? "Electronics deals"
      : category
        ? `${category}`
        : search
          ? `Results for “${search}”`
          : "Shop all products";

  const pageDescription =
    deals === "true"
      ? "Explore limited-time savings on practical upgrades for work, gaming, and everyday use."
      : category
        ? `Browse Zeus ${category.toLowerCase()} selected for dependable performance and everyday value.`
        : search
          ? "Compare matching products, refine your filters, or try a different search."
          : "Explore carefully selected electronics designed to improve the way you work, play, and create.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <header className="mb-8 max-w-3xl sm:min-h-40">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-700">
          Zeus catalog
        </p>
        <h1 className="min-h-[2.3em] font-display text-4xl font-bold tracking-tight text-foreground sm:min-h-0 sm:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
          {pageDescription}
        </p>
      </header>

      <div className="relative mb-8 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <nav aria-label="Product categories">
          <ul className="flex flex-wrap gap-2">
            {categoryLinks.map((categoryLink) => {
              const isActive = categoryLink.deals
                ? deals === "true"
                : deals !== "true" && category === categoryLink.category;

              return (
                <li key={categoryLink.label}>
                  <Link
                    href={categoryLink.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center justify-center rounded-ui border px-4 py-2 text-sm font-semibold ${
                      isActive
                        ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                        : "border-border bg-surface text-foreground hover:border-brand-500 hover:text-brand-700"
                    }`}
                  >
                    {categoryLink.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-wrap items-start gap-3 xl:justify-end">
          <ProductFilters />
          <SortDropdown currentSort={sort} />
        </div>
      </div>

      <p
        className="mb-4 text-sm font-medium text-muted"
        aria-live="polite"
        aria-atomic="true"
      >
        {products.length === 0
          ? "No products found"
          : `Showing ${products.length} ${
              products.length === 1 ? "product" : "products"
            }`}
      </p>

      {products.length === 0 ? (
        <div className="rounded-ui border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            No matching products
          </h2>
          <p className="mt-2 max-w-xl text-muted">
            Try clearing your filters or searching for a different product.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const reviewCount = product.reviews.length;

            const averageRating =
              reviewCount === 0
                ? 0
                : product.reviews.reduce(
                    (sum, review) => sum + review.rating,
                    0
                  ) / reviewCount;

            const productHasDiscount = hasDiscount(product.discountPercent);

            const discountedPrice = getDiscountedPrice(
              product.price,
              product.discountPercent
            );

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="border rounded-lg p-4 shadow hover:shadow-lg transition block"
              >
                <div className="mb-2 flex gap-2">
                  {product.stockCount === 0 && (
                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                      Out of Stock
                    </span>
                  )}

                  {product.stockCount > 0 && product.stockCount <= 10 && (
                    <span className="rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                      Low Stock
                    </span>
                  )}

                  {productHasDiscount && (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      {product.discountPercent}% OFF
                    </span>
                  )}

                  {product.isNew && (
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      New Arrival
                    </span>
                  )}

                  {product.isBestSeller && (
                    <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                      Best Seller
                    </span>
                  )}

                  {product.isFeatured && (
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      Featured
                    </span>
                  )}
                </div>
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={800}
                  height={600}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-[4/3] h-auto w-full rounded object-cover"
                />

                <h2 className="text-xl font-semibold mt-4">{product.name}</h2>

                <p className="text-gray-600">{product.description}</p>

                {productHasDiscount ? (
                  <div className="mt-2">
                    <p className="font-bold">${discountedPrice.toFixed(2)}</p>

                    <p className="text-sm text-gray-500 line-through">
                      ${product.price.toFixed(2)}
                    </p>

                    <p className="text-sm text-green-700">
                      {product.discountPercent}% off
                    </p>
                  </div>
                ) : (
                  <p className="font-bold mt-2">${product.price.toFixed(2)}</p>
                )}

                {reviewCount > 0 && (
                  <p className="text-sm text-gray-700 mt-1">
                    ⭐ {averageRating.toFixed(1)} / 5 ({reviewCount} reviews)
                  </p>
                )}

                {product.stockCount === 0 ? (
                  <p className="text-sm text-red-600 font-medium">
                    Out of stock
                  </p>
                ) : product.stockCount <= 10 ? (
                  <p className="text-sm text-orange-600 font-medium">
                    Only {product.stockCount} left
                  </p>
                ) : (
                  <p className="text-sm text-green-600 font-medium">In stock</p>
                )}
                <WishlistButton product={product} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
