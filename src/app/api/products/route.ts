import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDiscountedPrice } from "@/lib/pricing";

function parseOptionalNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const minPrice = parseOptionalNumber(searchParams.get("minPrice"));
  const maxPrice = parseOptionalNumber(searchParams.get("maxPrice"));
  const sort = searchParams.get("sort");
  const minRating = parseOptionalNumber(searchParams.get("minRating"));
  const deals = searchParams.get("deals");

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    {
      createdAt: "desc",
    },
    {
      id: "desc",
    },
  ];

  const where: Prisma.ProductWhereInput = {
    ...(category && {
      category,
    }),
    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
    ...(deals === "true" && {
      discountPercent: {
        gt: 0,
      },
    }),
  };

  let products = await prisma.product.findMany({
    where,
    include: {
      reviews: true,
    },
    orderBy,
  });

  if (minPrice !== undefined || maxPrice !== undefined) {
    products = products.filter((product) => {
      const finalPrice = getDiscountedPrice(
        product.price,
        product.discountPercent
      );

      return (
        (minPrice === undefined || finalPrice >= minPrice) &&
        (maxPrice === undefined || finalPrice <= maxPrice)
      );
    });
  }

  if (minRating !== undefined) {
    products = products.filter((product) => {
      const reviewCount = product.reviews.length;

      if (reviewCount === 0) {
        return false;
      }

      const averageRating =
        product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount;

      return averageRating >= minRating;
    });
  }

  if (sort === "price-asc" || sort === "price-desc") {
    products.sort((firstProduct, secondProduct) => {
      const firstPrice = getDiscountedPrice(
        firstProduct.price,
        firstProduct.discountPercent
      );
      const secondPrice = getDiscountedPrice(
        secondProduct.price,
        secondProduct.discountPercent
      );
      const priceDifference = firstPrice - secondPrice;

      if (priceDifference === 0) {
        return secondProduct.id.localeCompare(firstProduct.id);
      }

      return sort === "price-asc" ? priceDifference : -priceDifference;
    });
  }

  return NextResponse.json(products);
}
