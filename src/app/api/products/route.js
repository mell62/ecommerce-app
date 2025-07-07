import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
