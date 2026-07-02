import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");

  const search = searchParams.get("search");

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const sort = searchParams.get("sort");

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

  const products = await prisma.product.findMany({
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
    },
    orderBy,
  });

  return NextResponse.json(products);
}
