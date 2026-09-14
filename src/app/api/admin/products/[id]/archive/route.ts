import { Prisma } from "@prisma/client";
import { getAdminAccess } from "@/lib/admin-auth";
import { getDatabaseErrorDetails } from "@/lib/database-error";
import { prisma } from "@/lib/db";
import { isSameOriginRequest } from "@/lib/request-origin";

type AdminProductArchiveRouteContext = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

type ArchiveProductRequest = Readonly<{
  isArchived?: unknown;
}>;

async function getRequestBody(request: Request): Promise<ArchiveProductRequest> {
  try {
    return (await request.json()) as ArchiveProductRequest;
  } catch {
    return {};
  }
}

export async function PATCH(
  request: Request,
  { params }: AdminProductArchiveRouteContext
): Promise<Response> {
  try {
    if (!isSameOriginRequest(request)) {
      return Response.json(
        { error: "Cross-site requests are not allowed." },
        { status: 403 }
      );
    }

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

    const { isArchived } = await getRequestBody(request);

    if (typeof isArchived !== "boolean") {
      return Response.json(
        { error: "Choose whether the product should be archived." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        isArchived,
      },
      select: {
        id: true,
        name: true,
        isArchived: true,
      },
    });

    return Response.json({
      message: `${product.name} was ${product.isArchived ? "archived" : "restored"} successfully.`,
      product,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

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
      { error: "Failed to update the product archive status." },
      { status: 500 }
    );
  }
}
