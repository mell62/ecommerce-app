import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function OrdersPage({ searchParams }) {
  const success = (await searchParams)?.success;
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Orders</h1>

        <p>No orders found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      {success === "true" && (
        <div className="mb-6 rounded border border-green-200 bg-green-50 p-4 text-green-700">
          Order placed successfully!
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/products"
          className="inline-block rounded bg-black px-4 py-2 text-white"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const orderDate = new Date(order.createdAt).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          );

          return (
            <div key={order.id} className="border rounded-lg p-4">
              <h2 className="font-bold">Order #{order.id.slice(-6)}</h2>

              <p className="text-sm text-gray-600">Placed on {orderDate}</p>

              <span className="inline-block mt-2 rounded bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                {order.status}
              </span>

              <p>Total: ${order.totalPrice.toFixed(2)}</p>

              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id}>
                    {item.product.name} × {item.quantity}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
