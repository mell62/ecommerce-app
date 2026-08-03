import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

type OrdersPageProps = Readonly<{
  searchParams: Promise<{
    success?: string | string[];
  }>;
}>;

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { success } = await searchParams;
  const orderWasPlaced = Array.isArray(success)
    ? success.includes("true")
    : success === "true";

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
    },
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
    <main className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-8 sm:py-10 lg:py-12">
      <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            Zeus account
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Your orders
          </h1>
          <p className="mt-3 text-base leading-7 text-muted sm:text-lg">
            Review your purchases and the products included in each order.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex min-h-11 w-fit shrink-0 items-center justify-center rounded-ui border border-border bg-surface px-5 py-2.5 font-semibold text-foreground shadow-sm hover:-translate-y-0.5 hover:border-border-hover hover:text-brand-700 hover:shadow-card"
        >
          Continue shopping
        </Link>
      </header>

      {orderWasPlaced && (
        <div
          className="mb-6 flex items-start gap-3 rounded-ui border border-success/25 bg-success/5 p-4 text-success"
          role="status"
          aria-live="polite"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-sm font-bold text-white"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-4"
            >
              <path d="m5.5 10 3 3 6-6" />
            </svg>
          </span>
          <div>
            <p className="font-semibold">Order placed successfully</p>
            <p className="mt-1 text-sm leading-6">
              Your order has been saved and appears first in your history.
            </p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <section className="rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            No orders yet
          </h2>
          <p className="mt-2 max-w-xl leading-7 text-muted">
            When you place your first order, its products and total will appear
            here for easy reference.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
          >
            Explore products
          </Link>
        </section>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const orderDate = order.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <div key={order.id} className="border rounded-lg p-4">
                <h2 className="font-bold">Order #{order.id.slice(-6)}</h2>

                <p className="text-sm text-gray-600">Placed on {orderDate}</p>

                <span className="inline-block mt-2 rounded bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                  {order.status}
                </span>

                <p>Total: ${order.totalPrice.toFixed(2)}</p>

                <ul className="mt-4 space-y-2">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          width={56}
                          height={56}
                          sizes="56px"
                          className="h-14 w-14 rounded object-cover"
                        />

                        <span>
                          {item.product.name} &times; {item.quantity}
                        </span>
                      </div>

                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
