import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();

  const keyboard = await prisma.product.create({
    data: {
      name: "Mechanical Keyboard",
      description: "RGB mechanical keyboard with blue switches",
      price: 89.99,
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae",
      stockCount: 20,
      isNew: true,
      isBestSeller: true,
      isFeatured: false,
      reviews: {
        create: [
          {
            name: "Watson",
            rating: 5,
            comment: "Excellent typing feel and great RGB lighting.",
          },
          {
            name: "Lestrade",
            rating: 4,
            comment: "Solid keyboard for the price.",
          },
        ],
      },
    },
  });

  const mouse = await prisma.product.create({
    data: {
      name: "Gaming Mouse",
      description: "Wireless gaming mouse with adjustable DPI",
      price: 59.99,
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db",
      stockCount: 8,
      isNew: false,
      isBestSeller: false,
      isFeatured: true,
      reviews: {
        create: [
          {
            name: "Sherlock",
            rating: 5,
            comment:
              "Very responsive and comfortable for long gaming sessions.",
          },
        ],
      },
    },
  });

  const monitor = await prisma.product.create({
    data: {
      name: "27-inch Monitor",
      description: "144Hz IPS gaming monitor",
      price: 299.99,
      category: "Monitors",
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf",
      stockCount: 4,
      isNew: false,
      isBestSeller: true,
      isFeatured: true,
      reviews: {
        create: [
          {
            name: "Irene",
            rating: 4,
            comment: "Great refresh rate and good colors.",
          },
          {
            name: "James",
            rating: 5,
            comment: "Perfect monitor for gaming and work.",
          },
        ],
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
