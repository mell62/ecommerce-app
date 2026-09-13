import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateOrderPricing, getDiscountedPrice } from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/shipping-address";

const orderWithProductItems = {
  items: {
    include: {
      product: true,
    },
  },
} satisfies Prisma.OrderInclude;

export class StockConflictError extends Error {
  productName: string;

  constructor(productName: string) {
    super(`${productName} does not have enough stock available.`);
    this.name = "StockConflictError";
    this.productName = productName;
  }
}

export async function createOrderFromCart(
  userId: string,
  shippingAddress: ShippingAddress,
  checkoutIdempotencyKey: string
) {
  try {
    return await prisma.$transaction(
      async (transaction) => {
        const existingOrder = await transaction.order.findUnique({
          where: {
            userId_checkoutIdempotencyKey: {
              userId,
              checkoutIdempotencyKey,
            },
          },
          include: orderWithProductItems,
        });

        if (existingOrder) {
          return {
            outcome: "already-created",
            order: existingOrder,
          } as const;
        }

        const cart = await transaction.cart.findUnique({
          where: {
            userId,
          },
          select: {
            id: true,
            items: {
              select: {
                quantity: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    stockCount: true,
                    discountPercent: true,
                    isArchived: true,
                  },
                },
              },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          return { outcome: "empty-cart" } as const;
        }

        const archivedItem = cart.items.find(
          (item) => item.product.isArchived
        );

        if (archivedItem) {
          return {
            outcome: "unavailable-product",
            productName: archivedItem.product.name,
          } as const;
        }

        const unavailableItem = cart.items.find(
          (item) => item.quantity > item.product.stockCount
        );

        if (unavailableItem) {
          return {
            outcome: "insufficient-stock",
            productName: unavailableItem.product.name,
            stockCount: unavailableItem.product.stockCount,
          } as const;
        }

        const orderItems = cart.items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
          price: getDiscountedPrice(product.price, product.discountPercent),
        }));

        const subtotal = orderItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
        const pricing = calculateOrderPricing(subtotal);

        const order = await transaction.order.create({
          data: {
            status: "PENDING",
            paymentStatus: PaymentStatus.PENDING,
            subtotal: pricing.subtotal,
            shippingCost: pricing.shippingCost,
            estimatedTax: pricing.estimatedTax,
            totalPrice: pricing.total,
            userId,
            checkoutIdempotencyKey,
            shippingFullName: shippingAddress.fullName,
            shippingAddressLine1: shippingAddress.addressLine1,
            shippingAddressLine2: shippingAddress.addressLine2 || null,
            shippingCity: shippingAddress.city,
            shippingState: shippingAddress.state,
            shippingPostalCode: shippingAddress.postalCode,
            shippingCountry: shippingAddress.country,
            items: {
              create: orderItems,
            },
          },
          include: orderWithProductItems,
        });

        for (const item of orderItems) {
          const updateResult = await transaction.product.updateMany({
            where: {
              id: item.productId,
              isArchived: false,
              stockCount: {
                gte: item.quantity,
              },
            },
            data: {
              stockCount: {
                decrement: item.quantity,
              },
            },
          });

          if (updateResult.count === 0) {
            const productName =
              cart.items.find(
                (cartItem) => cartItem.product.id === item.productId
              )?.product.name ?? "A product";

            throw new StockConflictError(productName);
          }
        }

        await transaction.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });

        return {
          outcome: "success",
          order,
        } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingOrder = await prisma.order.findUnique({
        where: {
          userId_checkoutIdempotencyKey: {
            userId,
            checkoutIdempotencyKey,
          },
        },
        include: orderWithProductItems,
      });

      if (existingOrder) {
        return {
          outcome: "already-created",
          order: existingOrder,
        } as const;
      }
    }

    throw error;
  }
}
