import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");

  const search = searchParams.get("search");

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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(products);
}
