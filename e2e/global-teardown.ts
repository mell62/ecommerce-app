import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const E2E_EMAIL_PREFIX = "e2e-";
const E2E_EMAIL_DOMAIN = "@example.com";
const E2E_NAME_PREFIX = "E2E ";

export default async function globalTeardown(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  try {
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          startsWith: E2E_EMAIL_PREFIX,
          endsWith: E2E_EMAIL_DOMAIN,
        },
        name: {
          startsWith: E2E_NAME_PREFIX,
        },
      },
      select: {
        id: true,
      },
    });

    if (testUsers.length === 0) {
      return;
    }

    const userIds = testUsers.map((user) => user.id);

    await prisma.$transaction(async (transaction) => {
      const testOrders = await transaction.order.findMany({
        where: {
          userId: {
            in: userIds,
          },
        },
        select: {
          id: true,
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      const quantitiesByProduct = new Map<string, number>();

      for (const order of testOrders) {
        for (const item of order.items) {
          quantitiesByProduct.set(
            item.productId,
            (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
          );
        }
      }

      for (const [productId, quantity] of quantitiesByProduct) {
        await transaction.product.update({
          where: {
            id: productId,
          },
          data: {
            stockCount: {
              increment: quantity,
            },
          },
        });
      }

      const orderIds = testOrders.map((order) => order.id);

      await transaction.review.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      });

      if (orderIds.length > 0) {
        await transaction.orderItem.deleteMany({
          where: {
            orderId: {
              in: orderIds,
            },
          },
        });
        await transaction.order.deleteMany({
          where: {
            id: {
              in: orderIds,
            },
          },
        });
      }

      await transaction.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });
    });

    console.log(`Removed ${testUsers.length} temporary E2E test users.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
