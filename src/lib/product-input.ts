export const PRODUCT_NAME_MAX_LENGTH = 120;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 2_000;
export const PRODUCT_CATEGORY_MAX_LENGTH = 80;
export const PRODUCT_IMAGE_URL_MAX_LENGTH = 2_048;
export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const PRODUCT_IMAGE_ACCEPT =
  SUPPORTED_PRODUCT_IMAGE_MIME_TYPES.join(",");

export type SupportedProductImageMimeType =
  (typeof SUPPORTED_PRODUCT_IMAGE_MIME_TYPES)[number];

export function isSupportedProductImageMimeType(
  value: string
): value is SupportedProductImageMimeType {
  return SUPPORTED_PRODUCT_IMAGE_MIME_TYPES.some(
    (mimeType) => mimeType === value
  );
}

export type ProductInput = Readonly<{
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  stockCount: number;
  discountPercent: number;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
}>;

export type ProductInputField = keyof ProductInput;
export type ProductInputErrors = Partial<Record<ProductInputField, string>>;

export type ProductInputResult =
  | Readonly<{
      success: true;
      data: ProductInput;
    }>
  | Readonly<{
      success: false;
      errors: ProductInputErrors;
    }>;

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isSupportedProductImageUrl(imageUrl: string): boolean {
  if (imageUrl.startsWith("/") && !imageUrl.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(imageUrl);

    if (url.protocol !== "https:") {
      return false;
    }

    if (url.hostname === "images.unsplash.com") {
      return true;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return false;
    }

    const configuredSupabaseUrl = new URL(supabaseUrl);

    return (
      url.origin === configuredSupabaseUrl.origin &&
      url.pathname.startsWith(
        `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`
      )
    );
  } catch {
    return false;
  }
}

export function validateProductInput(value: unknown): ProductInputResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      success: false,
      errors: {
        name: "Enter a product name.",
      },
    };
  }

  const input = value as Record<string, unknown>;
  const name = getText(input.name);
  const description = getText(input.description);
  const category = getText(input.category);
  const imageUrl = getText(input.imageUrl);
  const price = input.price;
  const stockCount = input.stockCount;
  const discountPercent = input.discountPercent;
  const errors: ProductInputErrors = {};

  if (!name) {
    errors.name = "Enter a product name.";
  } else if (name.length > PRODUCT_NAME_MAX_LENGTH) {
    errors.name = `Use ${PRODUCT_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!description) {
    errors.description = "Enter a product description.";
  } else if (description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Use ${PRODUCT_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  if (!category) {
    errors.category = "Enter a category.";
  } else if (category.length > PRODUCT_CATEGORY_MAX_LENGTH) {
    errors.category = `Use ${PRODUCT_CATEGORY_MAX_LENGTH} characters or fewer.`;
  }

  if (!imageUrl) {
    errors.imageUrl = "Enter an image URL.";
  } else if (imageUrl.length > PRODUCT_IMAGE_URL_MAX_LENGTH) {
    errors.imageUrl = `Use ${PRODUCT_IMAGE_URL_MAX_LENGTH} characters or fewer.`;
  } else if (!isSupportedProductImageUrl(imageUrl)) {
    errors.imageUrl =
      "Use a local image path or an images.unsplash.com HTTPS URL.";
  }

  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    errors.price = "Enter a price greater than zero.";
  }

  if (
    typeof stockCount !== "number" ||
    !Number.isInteger(stockCount) ||
    stockCount < 0
  ) {
    errors.stockCount = "Enter a whole-number stock count of zero or more.";
  }

  if (
    typeof discountPercent !== "number" ||
    !Number.isInteger(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    errors.discountPercent = "Enter a whole-number discount from 0 to 100.";
  }

  for (const field of ["isFeatured", "isNew", "isBestSeller"] as const) {
    if (input[field] !== undefined && typeof input[field] !== "boolean") {
      errors[field] = "Choose whether this option is enabled.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      name,
      description,
      category,
      imageUrl,
      price: price as number,
      stockCount: stockCount as number,
      discountPercent: discountPercent as number,
      isFeatured: input.isFeatured === true,
      isNew: input.isNew === true,
      isBestSeller: input.isBestSeller === true,
    },
  };
}
