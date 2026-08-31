import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WishlistProvider from "@/components/WishlistProvider";
import HomePage from "./page";

const findManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: findManyMock,
    },
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const product = {
  id: "product-1",
  name: "Zeus Wireless Mouse",
  description: "A precise wireless mouse for comfortable everyday use.",
  category: "Accessories",
  price: 59.99,
  imageUrl: "/mouse.png",
  stockCount: 24,
  discountPercent: 10,
  isNew: true,
  isBestSeller: true,
  isFeatured: true,
  reviews: [{ rating: 5 }, { rating: 4 }],
};

describe("HomePage accessibility", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    findManyMock.mockResolvedValue([product]);
  });

  it("has no detectable accessibility violations with product sections", async () => {
    const page = await HomePage();
    const { container } = render(
      <WishlistProvider isAuthenticated={false}>{page}</WishlistProvider>
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Upgrade the way you work, play, and create",
      })
    ).toBeInTheDocument();

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
