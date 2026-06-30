import { prisma } from "@/lib/db";

export default async function OrdersPage() {
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

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-4">
            <h2 className="font-bold">Order #{order.id.slice(-6)}</h2>

            <p>Status: {order.status}</p>

            <p>Total: ${order.totalPrice.toFixed(2)}</p>

            <div className="mt-4 space-y-2">
              {order.items.map((item) => (
                <div key={item.id}>
                  {item.product.name} × {item.quantity}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
