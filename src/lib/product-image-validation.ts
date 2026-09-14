import {
  type SupportedProductImageMimeType,
  isSupportedProductImageMimeType,
} from "@/lib/product-input";

const imageSignatures: Readonly<
  Record<SupportedProductImageMimeType, readonly number[]>
> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/webp": [
    0x52,
    0x49,
    0x46,
    0x46,
    -1,
    -1,
    -1,
    -1,
    0x57,
    0x45,
    0x42,
    0x50,
  ],
};

export async function hasMatchingProductImageSignature(
  file: File
): Promise<boolean> {
  if (!isSupportedProductImageMimeType(file.type)) {
    return false;
  }

  const signature = imageSignatures[file.type];
  const header = new Uint8Array(
    await file.slice(0, signature.length).arrayBuffer()
  );

  return (
    header.length === signature.length &&
    signature.every(
      (expectedByte, index) =>
        expectedByte === -1 || header[index] === expectedByte
    )
  );
}
