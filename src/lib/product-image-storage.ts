import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  PRODUCT_IMAGE_BUCKET,
  isSupportedProductImageMimeType,
} from "@/lib/product-input";

const extensionByMimeType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const managedProductImagePathPattern =
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

function getProductImageStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase product image storage is not configured.");
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getManagedProductImagePath(imageUrl: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  try {
    const image = new URL(imageUrl);
    const configuredSupabaseUrl = new URL(supabaseUrl);
    const publicBucketPrefix = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;

    if (
      image.protocol !== "https:" ||
      image.origin !== configuredSupabaseUrl.origin ||
      !image.pathname.startsWith(publicBucketPrefix)
    ) {
      return null;
    }

    const objectPath = image.pathname.slice(publicBucketPrefix.length);

    return managedProductImagePathPattern.test(objectPath) ? objectPath : null;
  } catch {
    return null;
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!isSupportedProductImageMimeType(file.type)) {
    throw new Error("Unsupported product image type.");
  }

  const supabase = getProductImageStorageClient();
  const objectPath = `products/${crypto.randomUUID()}.${extensionByMimeType[file.type]}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error("Supabase could not store the product image.", {
      cause: error,
    });
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}

export async function deleteManagedProductImage(
  imageUrl: string
): Promise<boolean> {
  const objectPath = getManagedProductImagePath(imageUrl);

  if (!objectPath) {
    return false;
  }

  const supabase = getProductImageStorageClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove([objectPath]);

  if (error) {
    throw new Error("Supabase could not delete the product image.", {
      cause: error,
    });
  }

  return true;
}
