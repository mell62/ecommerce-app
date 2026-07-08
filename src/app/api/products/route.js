import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");

  const search = searchParams.get("search");

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const sort = searchParams.get("sort");

  const minRating = searchParams.get("minRating");

  const deals = searchParams.get("deals");

  let orderBy = [
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

  let products = await prisma.product.findMany({
    where: {
      ...(category && {
        category: category,
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

      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && {
            gte: Number(minPrice),
          }),
          ...(maxPrice && {
            lte: Number(maxPrice),
          }),
        },
      }),
      ...(deals === "true" && {
        discountPercent: {
          gt: 0,
        },
      }),
    },
    include: {
      reviews: true,
    },
    orderBy,
  });

  if (minRating) {
    products = products.filter((product) => {
      const reviewCount = product.reviews.length;

      if (reviewCount === 0) {
        return false;
      }

      const averageRating =
        product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount;

      return averageRating >= Number(minRating);
    });
  }

  return NextResponse.json(products);
}
