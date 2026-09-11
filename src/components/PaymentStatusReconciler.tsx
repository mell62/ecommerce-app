"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatusReconcilerProps = Readonly<{
  sessionId: string;
}>;

type ReconciliationState = "checking" | "pending" | "error";

function isPaidResponse(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "paymentStatus" in data &&
    data.paymentStatus === "PAID"
  );
}

async function requestPaymentStatus(sessionId: string): Promise<boolean> {
  const response = await fetch("/api/checkout/session/status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error("Payment verification failed.");
  }

  return isPaidResponse(data);
}

export default function PaymentStatusReconciler({
  sessionId,
}: PaymentStatusReconcilerProps) {
  const router = useRouter();
  const [state, setState] = useState<ReconciliationState>("checking");

  useEffect(() => {
    let isActive = true;

    void requestPaymentStatus(sessionId)
      .then((isPaid) => {
        if (!isActive) {
          return;
        }

        if (isPaid) {
          router.refresh();
          return;
        }

        setState("pending");
      })
      .catch(() => {
        if (isActive) {
          setState("error");
        }
      });

    return () => {
      isActive = false;
    };
  }, [router, sessionId]);

  function checkAgain(): void {
    setState("checking");

    void requestPaymentStatus(sessionId)
      .then((isPaid) => {
        if (isPaid) {
          router.refresh();
          return;
        }

        setState("pending");
      })
      .catch(() => {
        setState("error");
      });
  }

  if (state === "checking") {
    return (
      <p className="mt-2 text-sm font-medium" aria-live="polite">
        Checking the latest payment status...
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <p className="text-sm">
        {state === "pending"
          ? "Stripe still reports this payment as pending."
          : "We could not check Stripe right now."}
      </p>
      <button
        type="button"
        onClick={checkAgain}
        className="inline-flex min-h-10 items-center justify-center rounded-ui border border-current/30 px-3 py-2 text-sm font-semibold transition-colors hover:bg-brand-100/60"
      >
        Check again
      </button>
    </div>
  );
}
