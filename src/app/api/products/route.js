import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const products = await prisma.product.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
    return NextResponse.json(products);
}