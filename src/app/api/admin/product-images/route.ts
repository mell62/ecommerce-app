import { getAdminAccess } from "@/lib/admin-auth";
import { getDatabaseErrorDetails } from "@/lib/database-error";
import { prisma } from "@/lib/db";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  isSupportedProductImageMimeType,
} from "@/lib/product-input";
import { hasMatchingProductImageSignature } from "@/lib/product-image-validation";
import {
  deleteManagedProductImage,
  getManagedProductImagePath,
  uploadProductImage,
} from "@/lib/product-image-storage";
import { isSameOriginRequest } from "@/lib/request-origin";

type DeleteImageRequest = Readonly<{
  imageUrl?: unknown;
}>;

async function getUploadedFile(request: Request): Promise<File | null> {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    return image instanceof File ? image : null;
  } catch {
    return null;
  }
}

function getDatabaseErrorResponse(error: unknown): Response | null {
  const databaseError = getDatabaseErrorDetails(error);

  if (!databaseError) {
    return null;
  }

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

export async function POST(request: Request): Promise<Response> {
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
        { error: "You must be logged in to upload product images." },
        { status: 401 }
      );
    }

    if (access.status === "forbidden") {
      return Response.json(
        { error: "Administrator access is required." },
        { status: 403 }
      );
    }

    const image = await getUploadedFile(request);

    if (!image || image.size === 0) {
      return Response.json(
        { error: "Choose a product image to upload." },
        { status: 400 }
      );
    }

    if (!isSupportedProductImageMimeType(image.type)) {
      return Response.json(
        { error: "Use a JPEG, PNG, or WebP image." },
        { status: 415 }
      );
    }

    if (image.size > PRODUCT_IMAGE_MAX_BYTES) {
      return Response.json(
        { error: "Product images must be 5 MB or smaller." },
        { status: 413 }
      );
    }

    if (!(await hasMatchingProductImageSignature(image))) {
      return Response.json(
        { error: "The file contents do not match the selected image type." },
        { status: 415 }
      );
    }

    const imageUrl = await uploadProductImage(image);

    return Response.json({ imageUrl }, { status: 201 });
  } catch (error) {
    const databaseErrorResponse = getDatabaseErrorResponse(error);

    if (databaseErrorResponse) {
      return databaseErrorResponse;
    }

    console.error(error);

    return Response.json(
      { error: "Failed to upload product image." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
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
        { error: "You must be logged in to delete product images." },
        { status: 401 }
      );
    }

    if (access.status === "forbidden") {
      return Response.json(
        { error: "Administrator access is required." },
        { status: 403 }
      );
    }

    let body: DeleteImageRequest;

    try {
      body = (await request.json()) as DeleteImageRequest;
    } catch {
      return Response.json(
        { error: "Enter a valid product image URL." },
        { status: 400 }
      );
    }

    const imageUrl =
      typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    const objectPath = getManagedProductImagePath(imageUrl);

    if (!objectPath) {
      return Response.json(
        { error: "Only managed product images can be deleted." },
        { status: 400 }
      );
    }

    const possibleReferences = await prisma.product.findMany({
      where: {
        imageUrl: {
          contains: objectPath,
        },
      },
      select: {
        imageUrl: true,
      },
    });
    const isInUse = possibleReferences.some(
      (product) => getManagedProductImagePath(product.imageUrl) === objectPath
    );

    if (isInUse) {
      return Response.json(
        { error: "Images currently used by products cannot be deleted." },
        { status: 409 }
      );
    }

    await deleteManagedProductImage(imageUrl);

    return Response.json({ message: "Product image deleted successfully." });
  } catch (error) {
    const databaseErrorResponse = getDatabaseErrorResponse(error);

    if (databaseErrorResponse) {
      return databaseErrorResponse;
    }

    console.error(error);

    return Response.json(
      { error: "Failed to delete product image." },
      { status: 500 }
    );
  }
}
