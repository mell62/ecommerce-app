// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, POST } from "@/app/api/admin/product-images/route";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/product-input";

const getAdminAccessMock = vi.hoisted(() => vi.fn());
const uploadProductImageMock = vi.hoisted(() => vi.fn());
const deleteManagedProductImageMock = vi.hoisted(() => vi.fn());
const getManagedProductImagePathMock = vi.hoisted(() => vi.fn());
const productFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  getAdminAccess: getAdminAccessMock,
}));

vi.mock("@/lib/product-image-storage", () => ({
  deleteManagedProductImage: deleteManagedProductImageMock,
  getManagedProductImagePath: getManagedProductImagePathMock,
  uploadProductImage: uploadProductImageMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: productFindManyMock,
    },
  },
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

function createDeleteRequest(imageUrl: unknown): Request {
  return new Request("http://localhost/api/admin/product-images", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });
}

describe("admin product image upload API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccessMock.mockResolvedValue({
      status: "authorized",
      user: admin,
    });
    getManagedProductImagePathMock.mockImplementation((imageUrl: string) => {
      const marker = "/product-images/";
      const markerIndex = imageUrl.indexOf(marker);

      return markerIndex >= 0
        ? imageUrl.slice(markerIndex + marker.length).split("?")[0]
        : null;
    });
    productFindManyMock.mockResolvedValue([]);
    deleteManagedProductImageMock.mockResolvedValue(true);
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

  it("requires an administrator to delete a managed image", async () => {
    getAdminAccessMock.mockResolvedValue({ status: "unauthenticated" });

    const response = await DELETE(
      createDeleteRequest(
        "https://project.supabase.co/storage/v1/object/public/product-images/products/image.webp"
      )
    );

    expect(response.status).toBe(401);
    expect(productFindManyMock).not.toHaveBeenCalled();
    expect(deleteManagedProductImageMock).not.toHaveBeenCalled();
  });

  it("rejects deletion requests for unmanaged image URLs", async () => {
    const response = await DELETE(
      createDeleteRequest("https://images.unsplash.com/photo-123")
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Only managed product images can be deleted.",
    });
    expect(productFindManyMock).not.toHaveBeenCalled();
    expect(deleteManagedProductImageMock).not.toHaveBeenCalled();
  });

  it("preserves a managed image that is currently used by a product", async () => {
    const imageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/image.webp";
    productFindManyMock.mockResolvedValue([{ imageUrl: `${imageUrl}?width=800` }]);

    const response = await DELETE(createDeleteRequest(imageUrl));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Images currently used by products cannot be deleted.",
    });
    expect(deleteManagedProductImageMock).not.toHaveBeenCalled();
  });

  it("deletes an unused managed product image", async () => {
    const imageUrl =
      "https://project.supabase.co/storage/v1/object/public/product-images/products/image.webp";

    const response = await DELETE(createDeleteRequest(imageUrl));

    expect(response.status).toBe(200);
    expect(productFindManyMock).toHaveBeenCalledWith({
      where: {
        imageUrl: {
          contains: "products/image.webp",
        },
      },
      select: {
        imageUrl: true,
      },
    });
    expect(deleteManagedProductImageMock).toHaveBeenCalledWith(imageUrl);
    expect(await response.json()).toEqual({
      message: "Product image deleted successfully.",
    });
  });
});
