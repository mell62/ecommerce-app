import { describe, expect, it } from "vitest";
import { catalogProductFixtures } from "../../prisma/catalog-fixtures.ts";
import { reviewFixturesByProductName } from "../../prisma/review-fixtures.ts";

describe("catalog seed fixtures", () => {
  it("provides a varied 18-product catalog with unique images", () => {
    expect(catalogProductFixtures).toHaveLength(18);
    expect(new Set(catalogProductFixtures.map(({ name }) => name)).size).toBe(
      18
    );
    expect(
      new Set(catalogProductFixtures.map(({ imageUrl }) => imageUrl)).size
    ).toBe(18);
    expect(
      new Set(catalogProductFixtures.map(({ category }) => category))
    ).toEqual(new Set(["Accessories", "Monitors"]));
  });

  it("provides a valid and varied set of reviews for every product", () => {
    const ratingSignatures = new Set<string>();

    for (const product of catalogProductFixtures) {
      const reviews = reviewFixturesByProductName[product.name];

      expect(reviews.length).toBeGreaterThanOrEqual(13);
      expect(reviews.length).toBeLessThanOrEqual(17);
      expect(reviews.every(({ rating }) => rating >= 1 && rating <= 5)).toBe(
        true
      );
      expect(reviews.every(({ name, comment }) => name && comment)).toBe(true);

      ratingSignatures.add([...product.ratings].sort().join(""));
    }

    expect(ratingSignatures.size).toBeGreaterThan(10);
  });
});
