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

function formatOrderStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getOrderStatusClassName(status: string): string {
  switch (status.toUpperCase()) {
    case "DELIVERED":
      return "border-success/25 bg-success/5 text-success";
    case "CANCELLED":
      return "border-danger/25 bg-danger/5 text-danger";
    case "PROCESSING":
    case "SHIPPED":
      return "border-brand-500/25 bg-brand-50 text-brand-700";
    default:
      return "border-warning/25 bg-warning/5 text-warning";
  }
}

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
            const totalQuantity = order.items.reduce(
              (total, item) => total + item.quantity,
              0
            );
            const hasPricingBreakdown =
              order.subtotal > 0 || order.totalPrice === 0;

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-ui border border-border bg-surface shadow-sm"
              >
                <header className="flex flex-col gap-4 border-b border-border bg-surface-muted/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h2>
                      <span className="text-sm text-muted">
                        {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Placed on {orderDate}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${getOrderStatusClassName(order.status)}`}
                  >
                    {formatOrderStatus(order.status)}
                  </span>
                </header>

                <ul className="divide-y divide-border px-4 sm:px-6">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 py-4 sm:py-5"
                    >
                      <Link
                        href={`/products/${item.product.id}`}
                        className="group relative isolate flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-ui border border-border/70 bg-surface p-1 before:absolute before:inset-[16%] before:rounded-full before:bg-brand-100/65 before:blur-lg sm:size-20 sm:p-1.5"
                      >
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          sizes="(min-width: 640px) 80px, 64px"
                          className="relative z-10 h-full w-full object-contain drop-shadow-lg transition-transform duration-300 ease-[var(--store-ease-emphasized)] group-hover:scale-[1.03]"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="font-display font-semibold text-foreground hover:text-brand-700"
                        >
                          {item.product.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          Quantity {item.quantity}{" "}
                          <span aria-hidden="true">·</span> $
                          {item.price.toFixed(2)} each
                        </p>
                      </div>

                      <span className="shrink-0 self-start pt-1 font-semibold text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <footer className="border-t border-border bg-surface-muted/20 px-4 py-4 sm:px-6">
                  {hasPricingBreakdown ? (
                    <dl className="grid gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-muted">Subtotal</dt>
                        <dd className="mt-1 font-semibold text-foreground">
                          ${order.subtotal.toFixed(2)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Shipping</dt>
                        <dd className="mt-1 font-semibold text-foreground">
                          {order.shippingCost === 0
                            ? "Free"
                            : `$${order.shippingCost.toFixed(2)}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Estimated tax</dt>
                        <dd className="mt-1 font-semibold text-foreground">
                          ${order.estimatedTax.toFixed(2)}
                        </dd>
                      </div>
                      <div className="border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                        <dt className="text-muted">Total</dt>
                        <dd className="mt-1 text-lg font-bold text-foreground">
                          ${order.totalPrice.toFixed(2)}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-sm text-muted">Order total</dt>
                      <dd className="text-lg font-bold text-foreground">
                        ${order.totalPrice.toFixed(2)}
                      </dd>
                    </dl>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
