"use client";

import { useState } from "react";
import { redirectToStripeCheckout } from "@/lib/checkout-navigation";

type CompletePaymentButtonProps = Readonly<{
  orderId: string;
}>;

function getApiError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Failed to start secure payment.";
}

function getCheckoutUrl(data: unknown): string | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "checkoutUrl" in data &&
    typeof data.checkoutUrl === "string" &&
    data.checkoutUrl
  ) {
    return data.checkoutUrl;
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

export default function CompletePaymentButton({
  orderId,
}: CompletePaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function completePayment(): Promise<void> {
    if (isLoading) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(getApiError(data));
      }

      const checkoutUrl = getCheckoutUrl(data);

      if (!checkoutUrl) {
        throw new Error("The server did not return a payment URL.");
      }

      redirectToStripeCheckout(checkoutUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to start secure payment."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="sm:text-right">
      <button
        type="button"
        onClick={completePayment}
        disabled={isLoading}
        aria-busy={isLoading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
      >
        {isLoading && (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
          />
        )}
        {isLoading ? "Opening secure payment..." : "Complete payment"}
      </button>

      {error && (
        <p
          className="mt-2 max-w-sm text-left text-sm text-danger sm:text-right"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
