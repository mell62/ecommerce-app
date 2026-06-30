import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");

  const products = await prisma.product.findMany({
    where: {
      ...(category && {
        category: category,
      }),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(products);
}
