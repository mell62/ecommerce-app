"use client";

import { useEffect, useId, useState } from "react";

type ReviewSummaryProps = Readonly<{
  productId: string;
}>;

type SummaryState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "not-enough-reviews"; reviewCount: number }>
  | Readonly<{
      status: "ready";
      summary: string;
      reviewCount: number;
    }>
  | Readonly<{ status: "error" }>;

type StoredSummaryState = Readonly<{
  productId: string;
  value: SummaryState;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSummaryResponse(data: unknown): SummaryState | null {
  if (!isRecord(data) || typeof data.status !== "string") {
    return null;
  }

  if (
    data.status === "not-enough-reviews" &&
    typeof data.reviewCount === "number"
  ) {
    return {
      status: data.status,
      reviewCount: data.reviewCount,
    };
  }

  if (
    data.status === "ready" &&
    typeof data.summary === "string" &&
    data.summary.trim() &&
    typeof data.reviewCount === "number"
  ) {
    return {
      status: data.status,
      summary: data.summary.trim(),
      reviewCount: data.reviewCount,
    };
  }

  return null;
}

async function requestSummary(
  productId: string,
  signal: AbortSignal
): Promise<SummaryState> {
  const response = await fetch(
    `/api/products/${encodeURIComponent(productId)}/review-summary`,
    { signal }
  );
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error("Review summary request failed.");
  }

  const summaryState = parseSummaryResponse(data);

  if (!summaryState) {
    throw new Error("Review summary response was invalid.");
  }

  return summaryState;
}

export default function ReviewSummary({ productId }: ReviewSummaryProps) {
  const headingId = useId();
  const [requestNumber, setRequestNumber] = useState(0);
  const [storedState, setStoredState] = useState<StoredSummaryState>({
    productId,
    value: { status: "loading" },
  });
  const state =
    storedState.productId === productId
      ? storedState.value
      : ({ status: "loading" } as const);

  useEffect(() => {
    const controller = new AbortController();

    void requestSummary(productId, controller.signal)
      .then((nextState) => {
        if (!controller.signal.aborted) {
          setStoredState({ productId, value: nextState });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStoredState({ productId, value: { status: "error" } });
        }
      });

    return () => {
      controller.abort();
    };
  }, [productId, requestNumber]);

  return (
    <aside
      aria-labelledby={headingId}
      className="min-w-0 rounded-ui border border-brand-100 bg-brand-50/50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            AI summary
          </p>
          <h3
            id={headingId}
            className="mt-1 font-display text-xl font-semibold text-foreground"
          >
            What customers are saying
          </h3>
        </div>

        <span
          aria-hidden="true"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-brand-700 shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
              d="m12 3 1.35 4.15L17.5 8.5l-4.15 1.35L12 14l-1.35-4.15L6.5 8.5l4.15-1.35L12 3ZM18.5 14l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"
            />
          </svg>
        </span>
      </div>

      {state.status === "loading" && (
        <div className="mt-5" role="status" aria-live="polite">
          <span className="sr-only">Preparing the customer review summary.</span>
          <div
            aria-hidden="true"
            className="space-y-2.5 animate-pulse motion-reduce:animate-none"
          >
            <div className="h-3 w-full rounded-ui bg-brand-100" />
            <div className="h-3 w-11/12 rounded-ui bg-brand-100" />
            <div className="h-3 w-3/4 rounded-ui bg-brand-100" />
          </div>
        </div>
      )}

      {state.status === "ready" && (
        <div className="mt-5" aria-live="polite">
          <p className="[overflow-wrap:anywhere] leading-7 text-muted">
            {state.summary}
          </p>
          <p className="mt-4 border-t border-brand-100 pt-3 text-xs leading-5 text-muted">
            AI-generated from {state.reviewCount} customer{" "}
            {state.reviewCount === 1 ? "review" : "reviews"}. Read individual
            reviews for full context.
          </p>
        </div>
      )}

      {state.status === "not-enough-reviews" && (
        <div className="mt-5" aria-live="polite">
          <p className="font-semibold text-foreground">More feedback needed</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            A summary will appear after at least two customers have reviewed
            this product.
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-5" role="status" aria-live="polite">
          <p className="font-semibold text-foreground">Summary unavailable</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            You can still read every customer review below.
          </p>
          <button
            type="button"
            onClick={() => {
              setStoredState({ productId, value: { status: "loading" } });
              setRequestNumber((current) => current + 1);
            }}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-ui border border-brand-200 bg-surface px-4 py-2 text-sm font-semibold text-brand-700 transition-[border-color,color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/45 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )}
    </aside>
  );
}
