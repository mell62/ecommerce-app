"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllowedNextOrderStatuses } from "@/lib/order-status";

type OrderStatusControlProps = Readonly<{
  orderId: string;
  currentStatus: string;
  isPaid: boolean;
}>;

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Failed to update order status.";
}

export default function OrderStatusControl({
  orderId,
  currentStatus,
  isPaid,
}: OrderStatusControlProps) {
  const router = useRouter();
  const errorId = useId();
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const nextStatus = isPaid
    ? getAllowedNextOrderStatuses(currentStatus)[0]
    : undefined;

  if (!nextStatus) {
    return null;
  }

  const nextStatusLabel = formatStatus(nextStatus).toLowerCase();
  const shortOrderId = orderId.slice(-8).toUpperCase();

  async function updateStatus(): Promise<void> {
    setError("");
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });
      const contentType = response.headers.get("content-type");
      const data: unknown = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        setError(getStatusError(data));
        return;
      }

      router.replace("/admin/orders?updated=true");
      router.refresh();
    } catch {
      setError(
        "Unable to reach the server. Check your connection and try again."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="border-t border-border bg-surface-muted/20 px-4 py-4 sm:px-5">
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--store-ease-emphasized)] motion-reduce:transition-none ${
          isConfirming
            ? "grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100"
        }`}
        aria-hidden={isConfirming}
        inert={isConfirming}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex justify-end py-1">
            <button
              ref={actionButtonRef}
              type="button"
              onClick={() => {
                setIsConfirming(true);
                setError("");
                requestAnimationFrame(() => confirmButtonRef.current?.focus());
              }}
              className="inline-flex min-h-[var(--store-touch-target)] items-center justify-center rounded-ui border border-brand-100 bg-surface px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm hover:-translate-y-0.5 hover:border-border-hover hover:shadow-card"
            >
              Mark as {nextStatusLabel}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--store-ease-emphasized)] motion-reduce:transition-none ${
          isConfirming
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isConfirming}
        inert={!isConfirming}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="ml-auto max-w-lg rounded-ui border border-brand-100 bg-brand-50/60 p-4"
            role="group"
            aria-label={`Confirm status update for order ${shortOrderId}`}
          >
            <p className="font-semibold text-foreground">
              Mark order #{shortOrderId} as {nextStatusLabel}?
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              This advances the customer-visible fulfillment status.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={updateStatus}
                disabled={isUpdating}
                aria-describedby={error ? errorId : undefined}
                className="inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isUpdating ? "Updating..." : `Yes, mark as ${nextStatusLabel}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirming(false);
                  setError("");
                  requestAnimationFrame(() => actionButtonRef.current?.focus());
                }}
                disabled={isUpdating}
                className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground hover:border-border-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
            {error && (
              <p
                id={errorId}
                className="mt-3 text-sm leading-6 text-danger"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
