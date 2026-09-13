// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteManagedProductImage,
  getManagedProductImagePath,
  uploadProductImage,
} from "@/lib/product-image-storage";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-input";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

describe("product image storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_test-key");
    mocks.createClient.mockReturnValue({
      storage: {
        from: mocks.from,
      },
    });
    mocks.from.mockReturnValue({
      upload: mocks.upload,
      getPublicUrl: mocks.getPublicUrl,
      remove: mocks.remove,
    });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.getPublicUrl.mockReturnValue({
      data: {
        publicUrl:
          "https://project.supabase.co/storage/v1/object/public/product-images/products/generated.webp",
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uploads a product image under a randomized object path", async () => {
    const image = new File(["image"], "customer-filename.webp", {
      type: "image/webp",
    });

    const publicUrl = await uploadProductImage(image);

    expect(mocks.createClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "sb_secret_test-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    expect(mocks.from).toHaveBeenCalledWith(PRODUCT_IMAGE_BUCKET);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^products\/[0-9a-f-]+\.webp$/),
      image,
      {
        contentType: "image/webp",
        upsert: false,
      }
    );
    expect(publicUrl).toBe(
      "https://project.supabase.co/storage/v1/object/public/product-images/products/generated.webp"
    );
  });

  it("requires server-side Supabase configuration", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");

    await expect(
      uploadProductImage(
        new File(["image"], "product.png", { type: "image/png" })
      )
    ).rejects.toThrow("Supabase product image storage is not configured.");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("does not return a URL when Supabase rejects the upload", async () => {
    mocks.upload.mockResolvedValue({
      error: new Error("Storage unavailable"),
    });

    await expect(
      uploadProductImage(
        new File(["image"], "product.jpg", { type: "image/jpeg" })
      )
    ).rejects.toThrow("Supabase could not store the product image.");
    expect(mocks.getPublicUrl).not.toHaveBeenCalled();
  });

  it("extracts only product image paths managed by this application", () => {
    const managedPath =
      "products/123e4567-e89b-12d3-a456-426614174000.webp";

    expect(
      getManagedProductImagePath(
        `https://project.supabase.co/storage/v1/object/public/product-images/${managedPath}`
      )
    ).toBe(managedPath);
    expect(getManagedProductImagePath("/products/mouse.png")).toBeNull();
    expect(
      getManagedProductImagePath(
        "https://images.unsplash.com/photo-123456789/product.jpg"
      )
    ).toBeNull();
    expect(
      getManagedProductImagePath(
        `https://another-project.supabase.co/storage/v1/object/public/product-images/${managedPath}`
      )
    ).toBeNull();
    expect(
      getManagedProductImagePath(
        "https://project.supabase.co/storage/v1/object/public/product-images/products/manually-named.webp"
      )
    ).toBeNull();
  });

  it("deletes a managed product image from its bucket", async () => {
    const objectPath =
      "products/123e4567-e89b-12d3-a456-426614174000.png";
    const imageUrl = `https://project.supabase.co/storage/v1/object/public/product-images/${objectPath}`;

    await expect(deleteManagedProductImage(imageUrl)).resolves.toBe(true);
    expect(mocks.from).toHaveBeenCalledWith(PRODUCT_IMAGE_BUCKET);
    expect(mocks.remove).toHaveBeenCalledWith([objectPath]);
  });

  it("ignores external images without initializing a privileged client", async () => {
    await expect(
      deleteManagedProductImage(
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
      )
    ).resolves.toBe(false);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("reports a managed image deletion failure", async () => {
    mocks.remove.mockResolvedValue({
      error: new Error("Storage unavailable"),
    });
    const imageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/123e4567-e89b-12d3-a456-426614174000.jpg";

    await expect(deleteManagedProductImage(imageUrl)).rejects.toThrow(
      "Supabase could not delete the product image."
    );
  });
});
