// @vitest-environment node

import { describe, expect, it } from "vitest";
import { hasMatchingProductImageSignature } from "@/lib/product-image-validation";

describe("product image signatures", () => {
  it.each([
    {
      type: "image/jpeg",
      bytes: [0xff, 0xd8, 0xff, 0xe0],
    },
    {
      type: "image/png",
      bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    },
    {
      type: "image/webp",
      bytes: [
        0x52,
        0x49,
        0x46,
        0x46,
        0x10,
        0x00,
        0x00,
        0x00,
        0x57,
        0x45,
        0x42,
        0x50,
      ],
    },
  ])("accepts a valid $type signature", async ({ type, bytes }) => {
    const file = new File([new Uint8Array(bytes)], "product", { type });

    await expect(hasMatchingProductImageSignature(file)).resolves.toBe(true);
  });

  it("rejects text disguised with an image MIME type", async () => {
    const file = new File(["not really an image"], "product.png", {
      type: "image/png",
    });

    await expect(hasMatchingProductImageSignature(file)).resolves.toBe(false);
  });

  it("rejects image bytes that do not match the declared MIME type", async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const file = new File([jpegBytes], "product.png", { type: "image/png" });

    await expect(hasMatchingProductImageSignature(file)).resolves.toBe(false);
  });
});
