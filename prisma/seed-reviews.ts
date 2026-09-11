import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { reviewFixturesByProductName } from "./review-fixtures.ts";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const productNames = Object.keys(reviewFixturesByProductName);
  const reviewTotal = Object.values(reviewFixturesByProductName).reduce(
    (total, reviews) => total + reviews.length,
    0
  );

  for (const [productName, reviews] of Object.entries(
    reviewFixturesByProductName
  )) {
    if (reviews.length < 13 || reviews.length > 17) {
      throw new Error(
        `Expected around 15 review fixtures for "${productName}", found ${reviews.length}.`
      );
    }
  }

  const products = await prisma.product.findMany({
    where: {
      name: {
        in: productNames,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  for (const productName of productNames) {
    const matchingProducts = products.filter(
      (product) => product.name === productName
    );

    if (matchingProducts.length !== 1) {
      throw new Error(
        `Expected exactly one product named "${productName}", found ${matchingProducts.length}.`
      );
    }
  }

  await prisma.$transaction(
    products.flatMap((product) => {
      const reviews = reviewFixturesByProductName[product.name];

      return [
        prisma.productReviewSummary.deleteMany({
          where: {
            productId: product.id,
          },
        }),
        prisma.review.deleteMany({
          where: {
            productId: product.id,
            userId: null,
          },
        }),
        prisma.review.createMany({
          data: reviews.map((review) => ({
            ...review,
            productId: product.id,
          })),
        }),
      ];
    })
  );

  const seededReviewCounts = await Promise.all(
    products.map((product) =>
      prisma.review.count({
        where: {
          productId: product.id,
          userId: null,
        },
      })
    )
  );

  if (
    seededReviewCounts.some(
      (count, index) =>
        count !== reviewFixturesByProductName[products[index].name].length
    )
  ) {
    throw new Error("Sample review count verification failed.");
  }

  console.log(
    `Seeded ${reviewTotal} sample reviews across ${products.length} products.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
