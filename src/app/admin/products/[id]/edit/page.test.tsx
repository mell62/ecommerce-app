import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditProductPage from "@/app/admin/products/[id]/edit/page";

const productFindUniqueMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findUnique: productFindUniqueMock,
    },
  },
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/components/AdminProductForm", () => ({
  default: ({ product }: { product: { name: string } }) => (
    <p>Editing form for {product.name}</p>
  ),
}));

const product = {
  id: "product-1",
  name: "Gaming Mouse",
  description: "A precise wireless gaming mouse.",
  category: "Accessories",
  imageUrl: "/mouse.png",
  price: 59.99,
  stockCount: 8,
  discountPercent: 15,
  isFeatured: true,
  isNew: false,
  isBestSeller: true,
};

describe("EditProductPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the existing product into the editing workspace", async () => {
    productFindUniqueMock.mockResolvedValue(product);

    render(
      await EditProductPage({
        params: Promise.resolve({ id: "product-1" }),
      })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Edit Gaming Mouse" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Editing form for Gaming Mouse")
    ).toBeInTheDocument();
    expect(productFindUniqueMock).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        imageUrl: true,
        price: true,
        stockCount: true,
        discountPercent: true,
        isFeatured: true,
        isNew: true,
        isBestSeller: true,
      },
    });
  });

  it("uses the not-found boundary for an unknown product", async () => {
    productFindUniqueMock.mockResolvedValue(null);
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      EditProductPage({
        params: Promise.resolve({ id: "missing-product" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
