import { Prisma } from "@prisma/client";
import { getAdminAccess } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { validateProductInput } from "@/lib/product-input";

type AdminProductRouteContext = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

async function getRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  { params }: AdminProductRouteContext
): Promise<Response> {
  try {
    const access = await getAdminAccess();

    if (access.status === "unauthenticated") {
      return Response.json(
        { error: "You must be logged in to manage products." },
        { status: 401 }
      );
    }

    if (access.status === "forbidden") {
      return Response.json(
        { error: "Administrator access is required." },
        { status: 403 }
      );
    }

    const productId = (await params).id.trim();

    if (!productId) {
      return Response.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const result = validateProductInput(await getRequestBody(request));

    if (!result.success) {
      return Response.json(
        {
          error: "Enter valid product details.",
          fieldErrors: result.errors,
        },
        { status: 400 }
      );
    }

    const [product] = await prisma.$transaction([
      prisma.product.update({
        where: {
          id: productId,
        },
        data: result.data,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          imageUrl: true,
          price: true,
          stockCount: true,
          discountPercent: true,
          isFeatured: true,
          isNew: true,
          isBestSeller: true,
          createdAt: true,
        },
      }),
      prisma.productReviewSummary.deleteMany({
        where: {
          productId,
        },
      }),
    ]);

    return Response.json({ product });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    console.error(error);

    return Response.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}
