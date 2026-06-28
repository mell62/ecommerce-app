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
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "Mechanical Keyboard",
        description: "RGB mechanical keyboard with blue switches",
        price: 89.99,
        category: "Accessories",
        imageUrl:
          "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae",
        stockCount: 20,
      },
      {
        name: "Gaming Mouse",
        description: "Wireless gaming mouse with adjustable DPI",
        price: 59.99,
        category: "Accessories",
        imageUrl:
          "https://images.unsplash.com/photo-1527814050087-3793815479db",
        stockCount: 35,
      },
      {
        name: "27-inch Monitor",
        description: "144Hz IPS gaming monitor",
        price: 299.99,
        category: "Monitors",
        imageUrl:
          "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf",
        stockCount: 12,
      },
    ],
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });