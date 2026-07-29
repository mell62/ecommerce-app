import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
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

type SectionLinkProps = Readonly<{
  href: string;
  children: ReactNode;
}>;

function SectionLink({ href, children }: SectionLinkProps) {
  return (
    <Link
      href={href}
      className="group relative inline-flex min-h-11 w-fit items-center gap-2 px-1 font-semibold text-brand-700 after:absolute after:bottom-1.5 after:left-1 after:h-px after:w-8 after:bg-brand-500 after:transition-[width,background-color] after:duration-200 hover:text-brand-900 hover:after:w-[calc(100%-0.5rem)] hover:after:bg-brand-700"
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
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

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Upgrade the way you work, play, and create
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Explore carefully selected keyboards, mice, monitors, and everyday
              electronics built to make every setup feel better.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
              >
                Shop products
              </Link>

              <Link
                href="/products?deals=true"
                className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border bg-surface px-6 py-3 font-semibold text-foreground shadow-sm hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700"
              >
                Explore deals
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hero-setup-float relative mx-auto hidden w-full max-w-xl lg:block"
          >
            <span className="hero-signal-pulse absolute right-[28%] top-[45%] z-10 size-12 rounded-full bg-brand-500/10 blur-md" />
            <Image
              src="/hero-zeus-connected-v2.png"
              alt=""
              width={1717}
              height={916}
              priority
              sizes="(min-width: 1280px) 36rem, (min-width: 1024px) 45vw, 0px"
              className="aspect-[4/3] h-auto w-full object-cover object-right"
            />
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
            className="category-card group"
          >
            <span className="category-card-visual" aria-hidden="true">
              <svg
                viewBox="0 0 320 190"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="category-card-art"
              >
                <rect x="38" y="55" width="202" height="100" rx="7" />
                <rect
                  x="48"
                  y="65"
                  width="182"
                  height="80"
                  rx="3"
                  opacity=".35"
                />
                <path
                  d="M61 80h13m12 0h13m12 0h13m12 0h13m12 0h13m12 0h13M61 98h13m12 0h13m12 0h13m12 0h13m12 0h13m12 0h13M61 116h13m12 0h13m12 0h13m12 0h13m12 0h13m12 0h13M86 134h106"
                  opacity=".62"
                />
                <rect x="262" y="65" width="44" height="82" rx="22" />
                <path d="M284 66v25m-21 5h42" opacity=".62" />
              </svg>
            </span>

            <span className="category-card-content">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                Desk essentials
              </span>
              <span className="mt-2 block font-display text-2xl font-semibold text-foreground">
                Accessories
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted">
                Keyboards, mice, and everyday desk essentials.
              </span>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                Browse accessories
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </span>
          </Link>

          <Link
            href="/products?category=Monitors"
            className="category-card group"
          >
            <span className="category-card-visual" aria-hidden="true">
              <svg
                viewBox="0 0 320 190"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="category-card-art"
              >
                <rect x="43" y="23" width="247" height="132" rx="7" />
                <rect
                  x="54"
                  y="34"
                  width="225"
                  height="110"
                  rx="2"
                  opacity=".35"
                />
                <path d="M142 174h49m-25-19v19" />
                <path d="M75 116h72" opacity=".62" />
                <path d="M75 126h43" opacity=".35" />
                <circle
                  cx="255"
                  cy="119"
                  r="4"
                  fill="currentColor"
                  stroke="none"
                  opacity=".62"
                />
              </svg>
            </span>

            <span className="category-card-content">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                Visual clarity
              </span>
              <span className="mt-2 block font-display text-2xl font-semibold text-foreground">
                Monitors
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted">
                High-refresh displays for gaming and productivity.
              </span>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                Browse monitors
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
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

            <SectionLink href="/products?deals=true">
              View all deals
            </SectionLink>
          </div>

          {dealProducts.length === 0 ? (
            <div className="rounded-ui border border-border bg-surface p-6 text-muted">
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
                    className="group flex h-full flex-col overflow-hidden rounded-ui border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card"
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

          <SectionLink href="/products">View all products</SectionLink>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-ui border border-border bg-surface p-6 text-muted">
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
                  className="group flex h-full flex-col overflow-hidden rounded-ui border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card"
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
                Customer favorites
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Top rated products
              </h2>
              <p className="mt-3 text-muted">
                Highly rated gear backed by feedback from Zeus customers.
              </p>
            </div>

            <SectionLink href="/products?minRating=4">
              View 4+ rated
            </SectionLink>
          </div>

          {topRatedProducts.length === 0 ? (
            <div className="rounded-ui border border-border bg-surface p-6 text-muted">
              No rated products yet. Customer favorites will appear here as
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
                    className="group flex h-full flex-col overflow-hidden rounded-ui border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card"
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
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-700">
              Proven picks
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Best sellers
            </h2>
            <p className="mt-3 text-muted">
              Popular electronics customers return to for dependable performance
              and everyday value.
            </p>
          </div>

          <SectionLink href="/products">View all products</SectionLink>
        </div>

        {bestSellerProducts.length === 0 ? (
          <div className="rounded-ui border border-border bg-surface p-6 text-muted">
            No best sellers yet. Customer favorites will appear here soon.
          </div>
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
                  className="group flex h-full flex-col overflow-hidden rounded-ui border border-border bg-surface shadow-sm hover:-translate-y-1 hover:border-brand-500 hover:shadow-card"
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
                        Best seller
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
    </div>
  );
}
