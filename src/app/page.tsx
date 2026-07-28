import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDiscountedPrice, hasDiscount } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getRatingSummary(reviews: { rating: number }[]) {
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;

  return {
    reviewCount,
    averageRating,
  };
}

type ProductRatingProps = Readonly<{
  reviews: { rating: number }[];
}>;

function ProductRating({ reviews }: ProductRatingProps) {
  const { reviewCount, averageRating } = getRatingSummary(reviews);

  if (reviewCount === 0) {
    return null;
  }

  return (
    <p className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
      <span aria-hidden="true" className="text-warning">
        ★
      </span>
      <span>
        {averageRating.toFixed(1)}
        <span className="text-muted">
          {" "}
          · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </span>
      </span>
    </p>
  );
}

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: {
      isFeatured: true,
    },
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
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

  const productsWithReviews = await prisma.product.findMany({
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  const bestSellerProducts = await prisma.product.findMany({
    where: {
      isBestSeller: true,
    },
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
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

  const dealProducts = await prisma.product.findMany({
    where: {
      discountPercent: {
        gt: 0,
      },
    },
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    take: 3,
    orderBy: [
      {
        discountPercent: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  const topRatedProducts = productsWithReviews
    .map((product) => {
      const ratingSummary = getRatingSummary(product.reviews);

      return {
        ...product,
        ...ratingSummary,
      };
    })
    .filter((product) => product.reviewCount > 1)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-50 via-surface to-brand-100">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-32 size-80 rounded-full bg-brand-500/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mx-auto mb-5 w-fit rounded-full border border-brand-100 bg-surface/80 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
              Thoughtful tech for better setups
            </p>

            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Upgrade the way you work, play, and create
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Explore carefully selected keyboards, mice, monitors, and everyday
              electronics built to make every setup feel better.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
              >
                Shop products
              </Link>

              <Link
                href="/products?deals=true"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-6 py-3 font-semibold text-foreground shadow-sm hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700"
              >
                Explore deals
              </Link>
            </div>

            <p className="mt-8 text-sm font-medium text-muted">
              Keyboards <span aria-hidden="true">•</span> Mice{" "}
              <span aria-hidden="true">•</span> Monitors{" "}
              <span aria-hidden="true">•</span> Accessories
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-700">
            Find your next upgrade
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Shop by category
          </h2>
          <p className="mt-3 text-muted">
            Start with the gear that matters most to your desk, workflow, and
            downtime.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            href="/products?category=Accessories"
            className="group rounded-xl border border-border bg-surface p-6 shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card sm:p-8"
          >
            <span className="grid size-12 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="size-6"
              >
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
              </svg>
            </span>

            <h3 className="mt-6 text-xl font-semibold text-foreground">
              Accessories
            </h3>
            <p className="mt-2 text-muted">
              Keyboards, mice, and everyday desk essentials.
            </p>

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              Browse accessories
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </Link>

          <Link
            href="/products?category=Monitors"
            className="group rounded-xl border border-border bg-surface p-6 shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card sm:p-8"
          >
            <span className="grid size-12 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="size-6"
              >
                <rect x="3" y="4" width="18" height="13" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </span>

            <h3 className="mt-6 text-xl font-semibold text-foreground">
              Monitors
            </h3>
            <p className="mt-2 text-muted">
              High-refresh displays for gaming and productivity.
            </p>

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              Browse monitors
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-surface-muted">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-deal">
                Limited-time value
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Deals worth checking out
              </h2>
              <p className="mt-3 text-muted">
                Save on practical upgrades for work, gaming, and everyday use.
              </p>
            </div>

            <Link
              href="/products?deals=true"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-3 font-semibold text-brand-700 hover:bg-brand-50"
            >
              View all deals
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {dealProducts.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-muted">
              No deals are available right now. Check back soon for new offers.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dealProducts.map((product) => {
                const discountedPrice = getDiscountedPrice(
                  product.price,
                  product.discountPercent
                );

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card"
                  >
                    <div className="relative overflow-hidden bg-brand-50">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={800}
                        height={600}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />

                      <span className="absolute left-4 top-4 rounded-md bg-deal px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                        {product.discountPercent}% OFF
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-xl font-semibold text-foreground">
                        {product.name}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-muted">
                        {product.description}
                      </p>

                      <ProductRating reviews={product.reviews} />

                      <div className="mt-auto flex items-baseline gap-2 pt-5">
                        <p className="text-xl font-bold text-foreground">
                          ${discountedPrice.toFixed(2)}
                        </p>

                        <p className="text-sm text-muted line-through">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-baseline gap-1">
              <span className="text-sm font-semibold uppercase tracking-wider text-brand-700">
                Curated by
              </span>
              <span className="font-display text-base font-bold tracking-tight text-foreground">
                Zeus
              </span>
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Featured products
            </h2>
            <p className="mt-3 text-muted">
              Standout electronics selected for performance, usefulness, and
              everyday value.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-3 font-semibold text-brand-700 hover:bg-brand-50"
          >
            View all products
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-muted">
            Featured products are being selected. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => {
              const productHasDiscount = hasDiscount(product.discountPercent);

              const discountedPrice = getDiscountedPrice(
                product.price,
                product.discountPercent
              );

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card"
                >
                  <div className="relative overflow-hidden bg-brand-50">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={800}
                      height={600}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
                      <span className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                        Featured
                      </span>

                      {productHasDiscount && (
                        <span className="rounded-md bg-deal px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                          {product.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-xl font-semibold text-foreground">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {product.description}
                    </p>

                    <ProductRating reviews={product.reviews} />

                    {productHasDiscount ? (
                      <div className="mt-auto flex items-baseline gap-2 pt-5">
                        <p className="text-xl font-bold text-foreground">
                          ${discountedPrice.toFixed(2)}
                        </p>

                        <p className="text-sm text-muted line-through">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-auto pt-5 text-xl font-bold text-foreground">
                        ${product.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <section className="border-y border-border bg-surface-muted">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-700">
                Customer favourites
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Top rated products
              </h2>
              <p className="mt-3 text-muted">
                Highly rated gear backed by feedback from Zeus customers.
              </p>
            </div>

            <Link
              href="/products?minRating=4"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-3 font-semibold text-brand-700 hover:bg-brand-50"
            >
              View 4+ rated
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {topRatedProducts.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-muted">
              No rated products yet. Customer favourites will appear here as
              reviews arrive.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topRatedProducts.map((product) => {
                const productHasDiscount = hasDiscount(product.discountPercent);

                const discountedPrice = getDiscountedPrice(
                  product.price,
                  product.discountPercent
                );

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card"
                  >
                    <div className="relative overflow-hidden bg-brand-50">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={800}
                        height={600}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />

                      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
                        <span className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                          Top rated
                        </span>

                        {productHasDiscount && (
                          <span className="rounded-md bg-deal px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                            {product.discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-xl font-semibold text-foreground">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {product.description}
                      </p>

                      <p className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
                        <span aria-hidden="true" className="text-warning">
                          ★
                        </span>
                        <span>
                          {product.averageRating.toFixed(1)} out of 5{" "}
                          <span className="text-muted">
                            · {product.reviewCount}{" "}
                            {product.reviewCount === 1 ? "review" : "reviews"}
                          </span>
                        </span>
                      </p>

                      {productHasDiscount ? (
                        <div className="mt-auto flex items-baseline gap-2 pt-5">
                          <p className="text-xl font-bold text-foreground">
                            ${discountedPrice.toFixed(2)}
                          </p>

                          <p className="text-sm text-muted line-through">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-auto pt-5 text-xl font-bold text-foreground">
                          ${product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Best Sellers</h2>

          <Link href="/products" className="text-sm underline">
            View all
          </Link>
        </div>

        {bestSellerProducts.length === 0 ? (
          <p className="text-gray-600">No best sellers yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bestSellerProducts.map((product) => {
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
                  {productHasDiscount && (
                    <div className="mb-2">
                      <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        {product.discountPercent}% OFF
                      </span>
                    </div>
                  )}

                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={800}
                    height={600}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="aspect-[4/3] h-auto w-full rounded object-cover"
                  />

                  <h3 className="text-xl font-semibold mt-4">{product.name}</h3>
                  <p className="text-gray-600">{product.description}</p>

                  <ProductRating reviews={product.reviews} />

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
                    <p className="font-bold mt-2">
                      ${product.price.toFixed(2)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
