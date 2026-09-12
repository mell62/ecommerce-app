// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/product-images/route";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/product-image-storage";

const getAdminAccessMock = vi.hoisted(() => vi.fn());
const uploadProductImageMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  getAdminAccess: getAdminAccessMock,
}));

vi.mock("@/lib/product-image-storage", () => ({
  PRODUCT_IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  isSupportedProductImageMimeType: (value: string) =>
    ["image/jpeg", "image/png", "image/webp"].includes(value),
  uploadProductImage: uploadProductImageMock,
}));

const admin = {
  id: "admin-1",
  name: "Mycroft",
  email: "mycroft@example.com",
  role: "ADMIN",
};

function createUploadRequest(file?: File): Request {
  const formData = new FormData();

  if (file) {
    formData.set("image", file);
  }

  return new Request("http://localhost/api/admin/product-images", {
    method: "POST",
    body: formData,
  });
}

describe("admin product image upload API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccessMock.mockResolvedValue({
      status: "authorized",
      user: admin,
    });
  });

  it("requires a signed-in administrator", async () => {
    getAdminAccessMock.mockResolvedValue({ status: "unauthenticated" });

    const response = await POST(
      createUploadRequest(new File(["image"], "mouse.png", { type: "image/png" }))
    );

    expect(response.status).toBe(401);
    expect(uploadProductImageMock).not.toHaveBeenCalled();
  });

  it("rejects a signed-in non-admin user", async () => {
    getAdminAccessMock.mockResolvedValue({
      status: "forbidden",
      user: { ...admin, role: "USER" },
    });

    const response = await POST(
      createUploadRequest(new File(["image"], "mouse.png", { type: "image/png" }))
    );

    expect(response.status).toBe(403);
    expect(uploadProductImageMock).not.toHaveBeenCalled();
  });

  it("requires an image file", async () => {
    const response = await POST(createUploadRequest());

    expect(response.status).toBe(400);
    expect(uploadProductImageMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported file types", async () => {
    const response = await POST(
      createUploadRequest(
        new File(["not an image"], "product.svg", { type: "image/svg+xml" })
      )
    );

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({
      error: "Use a JPEG, PNG, or WebP image.",
    });
    expect(uploadProductImageMock).not.toHaveBeenCalled();
  });

  it("rejects images larger than five megabytes", async () => {
    const response = await POST(
      createUploadRequest(
        new File([new Uint8Array(PRODUCT_IMAGE_MAX_BYTES + 1)], "product.png", {
          type: "image/png",
        })
      )
    );

    expect(response.status).toBe(413);
    expect(uploadProductImageMock).not.toHaveBeenCalled();
  });

  it("uploads a validated product image", async () => {
    const image = new File(["image"], "mouse.webp", { type: "image/webp" });
    uploadProductImageMock.mockResolvedValue(
      "https://project.supabase.co/storage/v1/object/public/product-images/products/image.webp"
    );

    const response = await POST(createUploadRequest(image));

    expect(response.status).toBe(201);
    expect(uploadProductImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "mouse.webp",
        size: image.size,
        type: "image/webp",
      })
    );
    expect(await response.json()).toEqual({
      imageUrl:
        "https://project.supabase.co/storage/v1/object/public/product-images/products/image.webp",
    });
  });
});
