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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      <pre>{JSON.stringify(orders, null, 2)}</pre>
    </div>
  );
}
