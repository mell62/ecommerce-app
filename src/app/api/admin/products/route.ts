import { prisma } from "@/lib/db";
import { getAdminAccess } from "@/lib/admin-auth";
import { getDatabaseErrorDetails } from "@/lib/database-error";
import { validateProductInput } from "@/lib/product-input";

async function getRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
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

    const product = await prisma.product.create({
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
    });

    return Response.json({ product }, { status: 201 });
  } catch (error) {
    const databaseError = getDatabaseErrorDetails(error);

    if (databaseError) {
      return Response.json(
        { error: databaseError.message },
        {
          status: databaseError.status,
          headers: databaseError.retryAfterSeconds
            ? { "Retry-After": String(databaseError.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    console.error(error);

    return Response.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
