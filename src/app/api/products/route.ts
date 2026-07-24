import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    {
      createdAt: "desc",
    },
    {
      id: "desc",
    },
  ];

  if (sort === "price-asc") {
    orderBy = [
      {
        price: "asc",
      },
      {
        id: "desc",
      },
    ];
  }

  if (sort === "price-desc") {
    orderBy = [
      {
        price: "desc",
      },
      {
        id: "desc",
      },
    ];
  }

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
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && {
          gte: minPrice,
        }),
        ...(maxPrice !== undefined && {
          lte: maxPrice,
        }),
      },
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

  return NextResponse.json(products);
}
