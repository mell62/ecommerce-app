"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { calculateOrderPricing, ESTIMATED_TAX_RATE } from "@/lib/pricing";
import { redirectToStripeCheckout } from "@/lib/checkout-navigation";
import CheckoutSummarySkeleton from "@/components/CheckoutSummarySkeleton";
import ShippingAddressFields from "@/components/ShippingAddressFields";
import {
  validateShippingAddress,
  type ShippingAddress,
  type ShippingAddressErrors,
  type ShippingAddressField,
} from "@/lib/shipping-address";

type CheckoutContentsProps = Readonly<{
  initialFullName?: string;
}>;

type EditableShippingAddressField = Exclude<ShippingAddressField, "country">;

const addressFieldIds: Record<EditableShippingAddressField, string> = {
  fullName: "shipping-full-name",
  addressLine1: "shipping-address-line-1",
  addressLine2: "shipping-address-line-2",
  city: "shipping-city",
  state: "shipping-state",
  postalCode: "shipping-postal-code",
};

function getApiError(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

function getStringProperty(data: unknown, property: string): string | null {
  if (
    typeof data === "object" &&
    data !== null &&
    property in data &&
    typeof data[property as keyof typeof data] === "string"
  ) {
    return data[property as keyof typeof data] as string;
  }

  return null;
}

async function getResponseData(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function CheckoutContents({
  initialFullName = "",
}: CheckoutContentsProps) {
  const { items, isLoading, loadError, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState("");
  const [addressErrors, setAddressErrors] = useState<ShippingAddressErrors>({});
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: initialFullName,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const pricing = calculateOrderPricing(subtotal);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasStockIssue = items.some(
    (item) => item.stockCount === 0 || item.quantity > item.stockCount
  );

  function updateShippingAddress(
    field: EditableShippingAddressField,
    value: string
  ): void {
    setShippingAddress((currentAddress) => ({
      ...currentAddress,
      [field]: value,
    }));
    setAddressErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function focusFirstAddressError(errors: ShippingAddressErrors): void {
    const firstInvalidField = Object.keys(addressFieldIds).find(
      (field) => errors[field as EditableShippingAddressField]
    ) as EditableShippingAddressField | undefined;

    if (firstInvalidField) {
      document.getElementById(addressFieldIds[firstInvalidField])?.focus();
    }
  }

  async function placeOrder(): Promise<void> {
    if (isPlacingOrder || hasStockIssue) {
      return;
    }

    let orderId = pendingOrderId;

    setOrderError("");
    setIsPlacingOrder(true);

    try {
      if (!orderId) {
        const addressResult = validateShippingAddress(shippingAddress);

        if (!addressResult.success) {
          setAddressErrors(addressResult.errors);
          setOrderError("Check the highlighted shipping details.");
          focusFirstAddressError(addressResult.errors);
          return;
        }

        setAddressErrors({});

        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shippingAddress: addressResult.data,
          }),
        });
        const data = await getResponseData(response);

        if (!response.ok) {
          throw new Error(getApiError(data, "Failed to place order."));
        }

        orderId = getStringProperty(data, "id");

        if (!orderId) {
          throw new Error("The server did not return a valid order ID.");
        }

        setPendingOrderId(orderId);
        clearCart();
      }

      const checkoutResponse = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });
      const checkoutData = await getResponseData(checkoutResponse);

      if (!checkoutResponse.ok) {
        throw new Error(
          getApiError(checkoutData, "Failed to start secure payment.")
        );
      }

      const checkoutUrl = getStringProperty(checkoutData, "checkoutUrl");

      if (!checkoutUrl) {
        throw new Error("The server did not return a payment URL.");
      }

      redirectToStripeCheckout(checkoutUrl);
    } catch (error) {
      setOrderError(
        error instanceof Error ? error.message : "Failed to place order."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (isLoading) {
    return <CheckoutSummarySkeleton />;
  }

  if (loadError) {
    return (
      <div className="max-w-3xl">
        <div
          className="rounded-ui border border-border bg-surface p-6"
          role="alert"
        >
          <p className="font-semibold text-danger">{loadError}</p>
          <p className="mt-2 text-muted">Refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  if (pendingOrderId && items.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="rounded-ui border border-border bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
            Order created
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
            Your order is ready for payment
          </h2>
          <p className="mt-2 max-w-xl leading-7 text-muted">
            Your products have been reserved. Continue to Stripe to complete
            the payment for this order.
          </p>

          {orderError && (
            <p
              className="mt-5 rounded-ui border border-danger/25 bg-danger/5 p-3 text-sm text-danger"
              role="alert"
            >
              {orderError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={placeOrder}
              disabled={isPlacingOrder}
              aria-busy={isPlacingOrder}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isPlacingOrder && (
                <span
                  aria-hidden="true"
                  className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                />
              )}
              {isPlacingOrder
                ? "Preparing secure payment..."
                : "Try payment again"}
            </button>
            <Link
              href="/orders"
              className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border px-5 py-2.5 font-semibold text-foreground hover:border-brand-300 hover:bg-brand-50/60"
            >
              View orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="rounded-ui border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            Your cart is empty
          </h2>
          <p className="mt-2 text-muted">
            Add a product before continuing to checkout.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="grid gap-6">
        <section className="rounded-ui border border-border bg-surface p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Your products
              </h2>
              <p className="mt-1 text-sm text-muted">
                {totalQuantity} {totalQuantity === 1 ? "item" : "items"} ready
                to order
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex min-h-10 items-center justify-center rounded-ui px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              Edit cart
            </Link>
          </div>

          <div className="divide-y divide-border">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-4 py-5 last:pb-1"
              >
                <Link
                  href={`/products/${item.id}`}
                  className="group relative isolate flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-ui border border-border/70 bg-surface p-1 before:absolute before:inset-[16%] before:rounded-full before:bg-brand-100/65 before:blur-lg sm:size-24 sm:p-1.5"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={96}
                    height={96}
                    sizes="(min-width: 640px) 96px, 80px"
                    className="relative z-10 h-full w-full object-contain drop-shadow-lg transition-transform duration-300 ease-[var(--store-ease-emphasized)] group-hover:scale-[1.03]"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.id}`}
                    className="font-display font-semibold text-foreground hover:text-brand-700"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    Quantity {item.quantity} <span aria-hidden="true">·</span> $
                    {item.price.toFixed(2)} each
                  </p>
                  {item.price !== item.originalPrice && (
                    <p className="mt-1 text-xs font-medium text-brand-700">
                      {item.discountPercent}% discount applied
                    </p>
                  )}
                </div>

                <p className="shrink-0 self-start pt-1 font-semibold text-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <ShippingAddressFields
          address={shippingAddress}
          errors={addressErrors}
          disabled={isPlacingOrder}
          onChange={updateShippingAddress}
        />
      </div>

      <aside className="rounded-ui border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Order summary
        </h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Items</dt>
            <dd>{totalQuantity}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Subtotal</dt>
            <dd>${pricing.subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Shipping</dt>
            <dd>
              {pricing.shippingCost === 0
                ? "Free"
                : `$${pricing.shippingCost.toFixed(2)}`}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted">
            <dt>Estimated tax ({ESTIMATED_TAX_RATE * 100}%)</dt>
            <dd>${pricing.estimatedTax.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4 text-lg font-bold text-foreground">
            <dt>Estimated total</dt>
            <dd>${pricing.total.toFixed(2)}</dd>
          </div>
        </dl>

        {hasStockIssue && (
          <div
            className="mt-5 rounded-ui border border-danger/25 bg-danger/5 p-3 text-sm text-danger"
            role="alert"
          >
            <p>Some quantities are no longer available.</p>
            <Link href="/cart" className="mt-1 inline-block font-semibold">
              Return to cart
            </Link>
          </div>
        )}

        {orderError && (
          <p
            className="mt-5 rounded-ui border border-danger/25 bg-danger/5 p-3 text-sm text-danger"
            role="alert"
          >
            {orderError}
          </p>
        )}

        <button
          type="button"
          onClick={placeOrder}
          disabled={isPlacingOrder || hasStockIssue}
          aria-busy={isPlacingOrder}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isPlacingOrder && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
            />
          )}
          {isPlacingOrder ? "Preparing secure payment..." : "Continue to payment"}
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-muted">
          You will complete your payment securely through Stripe.
        </p>
      </aside>
    </div>
  );
}
