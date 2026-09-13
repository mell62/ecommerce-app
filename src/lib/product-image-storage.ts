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

export async function uploadProductImage(file: File): Promise<string> {
  if (!isSupportedProductImageMimeType(file.type)) {
    throw new Error("Unsupported product image type.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase product image storage is not configured.");
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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
