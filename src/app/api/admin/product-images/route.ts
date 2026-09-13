import { getAdminAccess } from "@/lib/admin-auth";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  isSupportedProductImageMimeType,
} from "@/lib/product-input";
import { uploadProductImage } from "@/lib/product-image-storage";

async function getUploadedFile(request: Request): Promise<File | null> {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    return image instanceof File ? image : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
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

    const imageUrl = await uploadProductImage(image);

    return Response.json({ imageUrl }, { status: 201 });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to upload product image." },
      { status: 500 }
    );
  }
}
