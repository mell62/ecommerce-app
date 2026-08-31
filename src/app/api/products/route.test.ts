import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const productFindManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: productFindManyMock,
    },
  },
}));

function createProduct(
  id: string,
  price: number,
  discountPercent: number,
  ratings: number[]
) {
  return {
    id,
    name: `Product ${id}`,
    description: "A useful electronic product.",
    category: "Accessories",
    price,
    imageUrl: `/${id}.png`,
    stockCount: 10,
    discountPercent,
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    createdAt: new Date("2026-08-01T12:00:00.000Z"),
    updatedAt: new Date("2026-08-01T12:00:00.000Z"),
    reviews: ratings.map((rating, index) => ({
      id: `${id}-review-${index}`,
      rating,
    })),
  };
}

describe("products API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds database filters for category, search, and deals", async () => {
    productFindManyMock.mockResolvedValue([]);

    const response = await GET(
      new Request(
        "http://localhost/api/products?category=Accessories&search=mouse&deals=true"
      )
    );

    expect(response.status).toBe(200);
    expect(productFindManyMock).toHaveBeenCalledWith({
      where: {
        category: "Accessories",
        OR: [
          {
            name: {
              contains: "mouse",
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: "mouse",
              mode: "insensitive",
            },
          },
        ],
        discountPercent: {
          gt: 0,
        },
      },
      include: {
        reviews: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  });

  it("applies price filters to the discounted customer price", async () => {
    const discountedBelowMinimum = createProduct("mouse", 59.99, 15, [5]);
    const fullPriceAboveMinimum = createProduct("keyboard", 60, 0, [5]);
    productFindManyMock.mockResolvedValue([
      discountedBelowMinimum,
      fullPriceAboveMinimum,
    ]);

    const response = await GET(
      new Request("http://localhost/api/products?minPrice=55")
    );
    const products = await response.json();

    expect(products.map((product: { id: string }) => product.id)).toEqual([
      fullPriceAboveMinimum.id,
    ]);
  });

  it("filters by average rating and sorts by effective price", async () => {
    const discountedProduct = createProduct("discounted", 100, 50, [5, 5]);
    const lowerPriceProduct = createProduct("lower", 45, 0, [4, 4]);
    const lowRatedProduct = createProduct("low-rated", 30, 0, [3, 3]);
    productFindManyMock.mockResolvedValue([
      discountedProduct,
      lowerPriceProduct,
      lowRatedProduct,
    ]);

    const response = await GET(
      new Request("http://localhost/api/products?minRating=4&sort=price-asc")
    );
    const products = await response.json();

    expect(products.map((product: { id: string }) => product.id)).toEqual([
      "lower",
      "discounted",
    ]);
  });

  it("ignores invalid numeric filters instead of hiding products", async () => {
    const product = createProduct("mouse", 59.99, 15, [5]);
    productFindManyMock.mockResolvedValue([product]);

    const response = await GET(
      new Request(
        "http://localhost/api/products?minPrice=invalid&minRating=invalid"
      )
    );

    const products = await response.json();

    expect(products.map((item: { id: string }) => item.id)).toEqual([
      product.id,
    ]);
  });
});
