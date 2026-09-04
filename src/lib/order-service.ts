import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateOrderPricing, getDiscountedPrice } from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/shipping-address";

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
  shippingAddress: ShippingAddress
) {
  return prisma.$transaction(
    async (transaction) => {
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
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return { outcome: "empty-cart" } as const;
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
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      for (const item of orderItems) {
        const updateResult = await transaction.product.updateMany({
          where: {
            id: item.productId,
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
}
