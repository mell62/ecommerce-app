import { PaymentStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import OrderStatusControl from "@/components/OrderStatusControl";
import TransientQueryNotice from "@/components/TransientQueryNotice";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Manage orders",
  description: "Review customer orders, payments, and fulfillment at Zeus.",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const orderNoticeQueryParameters = ["updated"];

type AdminOrdersPageProps = Readonly<{
  searchParams: Promise<{
    updated?: string | string[];
    view?: string | string[];
  }>;
}>;

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getFulfillmentStatusClassName(status: string): string {
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

function getPaymentStatusClassName(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PAID:
      return "border-success/25 bg-success/5 text-success";
    case PaymentStatus.FAILED:
    case PaymentStatus.REFUNDED:
      return "border-danger/25 bg-danger/5 text-danger";
    case PaymentStatus.PENDING:
      return "border-warning/25 bg-warning/5 text-warning";
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const wasUpdated =
    (Array.isArray(resolvedSearchParams.updated)
      ? resolvedSearchParams.updated[0]
      : resolvedSearchParams.updated) === "true";
  const orderView = Array.isArray(resolvedSearchParams.view)
    ? resolvedSearchParams.view[0]
    : resolvedSearchParams.view;
  const isFulfillmentView = orderView === "fulfillment";
  const orders = await prisma.order.findMany({
    ...(isFulfillmentView
      ? {
          where: {
            paymentStatus: PaymentStatus.PAID,
            status: {
              in: ["PROCESSING", "SHIPPED"],
            },
          },
        }
      : {}),
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      totalPrice: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-10 sm:py-12 lg:py-16">
      <Link
        href="/admin"
        className="inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold text-brand-700 underline decoration-brand-100 decoration-2 underline-offset-4 transition-colors hover:decoration-brand-500"
      >
        Back to dashboard
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            Order management
          </p>
          <h1 className="mt-2 font-display text-[var(--store-text-page-title)] font-semibold tracking-tight text-foreground">
            {isFulfillmentView ? "Awaiting fulfillment" : "Customer orders"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            {isFulfillmentView
              ? "Focus on paid orders that still need to be shipped or delivered."
              : "Review purchases, payment state, and fulfillment progress across Zeus."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
          {isFulfillmentView && orders.length > 0 && (
            <Link
              href="/admin/orders"
              className="inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold text-brand-700 underline decoration-brand-100 decoration-2 underline-offset-4 transition-colors hover:decoration-brand-500"
            >
              View all orders
            </Link>
          )}
        </div>
      </div>

      {wasUpdated && (
        <TransientQueryNotice queryParameters={orderNoticeQueryParameters}>
          <p
            className="mt-6 rounded-ui border border-success/25 bg-success/5 px-4 py-3 text-sm font-medium text-success"
            role="status"
          >
            Order status updated successfully.
          </p>
        </TransientQueryNotice>
      )}

      {orders.length === 0 ? (
        <section className="mt-8 rounded-ui border border-dashed border-border bg-surface px-5 py-10 text-center">
          <h2 className="font-display text-xl font-semibold text-foreground">
            {isFulfillmentView
              ? "No orders awaiting fulfillment"
              : "No customer orders yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {isFulfillmentView
              ? "Every paid order has completed its fulfillment journey."
              : "New purchases will appear here when customers place their orders."}
          </p>
          {isFulfillmentView && (
            <Link
              href="/admin/orders"
              className="mt-4 inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold text-brand-700 underline decoration-brand-100 decoration-2 underline-offset-4 transition-colors hover:decoration-brand-500"
            >
              View all orders
            </Link>
          )}
        </section>
      ) : (
        <ol className="mt-8 grid gap-5" aria-label="Customer orders">
          {orders.map((order) => {
            const totalQuantity = order.items.reduce(
              (total, item) => total + item.quantity,
              0
            );
            const orderDate = order.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <li key={order.id}>
                <article className="overflow-hidden rounded-ui border border-border bg-surface shadow-sm">
                  <header className="grid gap-4 border-b border-border bg-surface-muted/35 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="font-display text-lg font-semibold text-foreground">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </h2>
                        <span className="text-sm text-muted">
                          {totalQuantity}{" "}
                          {totalQuantity === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        Placed {orderDate}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getFulfillmentStatusClassName(order.status)}`}
                      >
                        {formatStatus(order.status)}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClassName(order.paymentStatus)}`}
                      >
                        Payment {formatStatus(order.paymentStatus)}
                      </span>
                    </div>
                  </header>

                  <div className="grid gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(0,1.3fr)_auto]">
                    <section
                      aria-label={`Customer for order ${order.id.slice(-8).toUpperCase()}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Customer
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        {order.user.name}
                      </p>
                      <p className="mt-1 break-all text-sm text-muted">
                        {order.user.email}
                      </p>
                    </section>

                    <section
                      aria-label={`Products for order ${order.id.slice(-8).toUpperCase()}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Products
                      </p>
                      <ul className="mt-2 space-y-2">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm"
                          >
                            <span className="text-foreground">
                              {item.product.name} × {item.quantity}
                            </span>
                            <span className="text-muted">
                              {currencyFormatter.format(
                                item.price * item.quantity
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <dl className="border-t border-border pt-4 lg:min-w-32 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 lg:text-right">
                      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Total
                      </dt>
                      <dd className="mt-2 font-display text-xl font-semibold text-foreground">
                        {currencyFormatter.format(order.totalPrice)}
                      </dd>
                    </dl>
                  </div>
                  <OrderStatusControl
                    orderId={order.id}
                    currentStatus={order.status}
                    isPaid={order.paymentStatus === PaymentStatus.PAID}
                  />
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
