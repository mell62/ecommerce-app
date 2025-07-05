import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany(); // Clear old data if re-running

  await prisma.product.createMany({
    data: [
      {
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse with long battery life",
        price: 29.99,
        category: "Accessories",
        imageUrl: "https://via.placeholder.com/300?text=Wireless+Mouse",
        stockCount: 50,
      },
      {
        name: "Mechanical Keyboard",
        description: "RGB mechanical keyboard with blue switches.",
        price: 69.99,
        category: "Accessories",
        imageUrl: "https://via.placeholder.com/300?text=Keyboard",
        stockCount: 30,
      },
      {
        name: "HD Monitor",
        description: "24-inch Full HD monitor with vibrant colors.",
        price: 149.99,
        category: "Electronics",
        imageUrl: "https://via.placeholder.com/300?text=Monitor",
        stockCount: 20,
      },
    ],
  });

  console.log("Sample products seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
