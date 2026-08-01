"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

type DeleteReviewButtonProps = Readonly<{
  reviewId: string;
}>;

export default function DeleteReviewButton({
  reviewId,
}: DeleteReviewButtonProps) {
  const router = useRouter();
  const confirmationId = useId();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isConfirming) {
      cancelButtonRef.current?.focus();
    }
  }, [isConfirming]);

  function openConfirmation(): void {
    setError("");
    setIsConfirming(true);
  }

  function closeConfirmation(): void {
    setError("");
    setIsConfirming(false);

    requestAnimationFrame(() => deleteButtonRef.current?.focus());
  }

  function handleConfirmationKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ): void {
    if (event.key === "Escape" && !isDeleting) {
      closeConfirmation();
    }
  }

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to delete review.";

        setError(message);
        return;
      }

      setIsConfirming(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong while deleting the review.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isConfirming) {
    return (
      <div
        role="group"
        aria-labelledby={confirmationId}
        onKeyDown={handleConfirmationKeyDown}
        className="w-full shrink-0 rounded-ui border border-danger/25 bg-danger/5 p-4"
      >
        <p id={confirmationId} className="font-semibold text-foreground">
          Delete this review?
        </p>
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex min-h-10 items-center justify-center rounded-ui bg-danger px-4 py-2 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Yes, delete review"}
          </button>
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={closeConfirmation}
            disabled={isDeleting}
            className="inline-flex min-h-10 items-center justify-center rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-border-hover hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        ref={deleteButtonRef}
        type="button"
        onClick={openConfirmation}
        className="inline-flex min-h-10 items-center justify-center rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-danger shadow-sm hover:border-danger/40 hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Delete review
      </button>
    </div>
  );
}
