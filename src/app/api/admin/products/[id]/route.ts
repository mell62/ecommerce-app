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

export async function DELETE(
  _request: Request,
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

    const result = await prisma.$transaction(
      async (transaction) => {
        const product = await transaction.product.findUnique({
          where: {
            id: productId,
          },
          select: {
            id: true,
            name: true,
          },
        });

        if (!product) {
          return {
            outcome: "not-found" as const,
          };
        }

        const orderItemCount = await transaction.orderItem.count({
          where: {
            productId,
          },
        });

        if (orderItemCount > 0) {
          return {
            outcome: "used-in-orders" as const,
          };
        }

        await transaction.review.deleteMany({
          where: {
            productId,
          },
        });
        await transaction.product.delete({
          where: {
            id: productId,
          },
        });

        return {
          outcome: "deleted" as const,
          product,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    if (result.outcome === "not-found") {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    if (result.outcome === "used-in-orders") {
      return Response.json(
        {
          error:
            "Products included in customer orders cannot be deleted because their order history must be preserved.",
        },
        { status: 409 }
      );
    }

    return Response.json({
      message: `${result.product.name} was deleted successfully.`,
      productId: result.product.id,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2034")
    ) {
      return Response.json(
        {
          error:
            "The product could not be deleted because related store data changed. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    console.error(error);

    return Response.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
