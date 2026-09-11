import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { reviewFixturesByProductName } from "./review-fixtures.ts";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main(): Promise<void> {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.product.deleteMany(),
  ]);

  await prisma.product.create({
    data: {
      name: "Mechanical Keyboard",
      description: "RGB mechanical keyboard with blue switches",
      price: 89.99,
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae",
      stockCount: 20,
      discountPercent: 10,
      isNew: false,
      isBestSeller: true,
      isFeatured: false,
      reviews: {
        create: [...reviewFixturesByProductName["Mechanical Keyboard"]],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Gaming Mouse",
      description: "Wireless gaming mouse with adjustable DPI",
      price: 59.99,
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db",
      stockCount: 35,
      discountPercent: 15,
      isNew: false,
      isBestSeller: false,
      isFeatured: true,
      reviews: {
        create: [...reviewFixturesByProductName["Gaming Mouse"]],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "27-inch Monitor",
      description: "144Hz IPS gaming monitor",
      price: 299.99,
      category: "Monitors",
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf",
      stockCount: 12,
      discountPercent: 20,
      isNew: true,
      isBestSeller: false,
      isFeatured: false,
      reviews: {
        create: [...reviewFixturesByProductName["27-inch Monitor"]],
      },
    },
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
