import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { catalogProductFixtures } from "./catalog-fixtures.ts";
import { reviewFixturesByProductName } from "./review-fixtures.ts";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await prisma.$transaction([
    prisma.productReviewSummary.deleteMany(),
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.product.deleteMany(),
  ]);

  for (const fixture of catalogProductFixtures) {
    const { ratings, strengths, concerns, ...productData } = fixture;
    void ratings;
    void strengths;
    void concerns;

    await prisma.product.create({
      data: {
        ...productData,
        reviews: {
          create: [...reviewFixturesByProductName[productData.name]],
        },
      },
    });
  }

  const productCount = await prisma.product.count();
  const reviewCount = await prisma.review.count();
  console.log(
    `Database seeded with ${productCount} products and ${reviewCount} reviews.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
