"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReviewForm from "@/components/ReviewForm";

type ReviewActionsProps = Readonly<{
  reviewId: string;
  initialRating: number;
  initialComment: string;
}>;

type OpenPanel = "edit" | "delete" | null;

export default function ReviewActions({
  reviewId,
  initialRating,
  initialComment,
}: ReviewActionsProps) {
  const router = useRouter();
  const confirmationId = useId();
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelDeleteButtonRef = useRef<HTMLButtonElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = setTimeout(() => setSuccessMessage(""), 3000);

    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  function closePanel(trigger: "edit" | "delete"): void {
    setOpenPanel(null);
    setError("");

    requestAnimationFrame(() => {
      const triggerRef =
        trigger === "edit" ? editButtonRef : deleteButtonRef;
      triggerRef.current?.focus();
    });
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
        body: JSON.stringify({ reviewId }),
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

      setOpenPanel(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong while deleting the review.");
    } finally {
      setIsDeleting(false);
    }
  }

  const isChoosingAction = openPanel === null;
  const isEditing = openPanel === "edit";
  const isConfirmingDelete = openPanel === "delete";

  return (
    <div className="mt-5 border-t border-border pt-4">
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--store-ease-emphasized)] motion-reduce:transition-none ${
          isChoosingAction
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isChoosingAction}
        inert={!isChoosingAction}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap gap-3 py-0.5">
            <button
              ref={editButtonRef}
              type="button"
              onClick={() => {
                setSuccessMessage("");
                setOpenPanel("edit");
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-border-hover hover:text-brand-700"
            >
              Edit review
            </button>
            <button
              ref={deleteButtonRef}
              type="button"
              onClick={() => {
                setError("");
                setOpenPanel("delete");
                requestAnimationFrame(() =>
                  cancelDeleteButtonRef.current?.focus()
                );
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-danger shadow-sm hover:border-danger/40 hover:bg-danger/5"
            >
              Delete review
            </button>
          </div>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--store-ease-emphasized)] motion-reduce:transition-none ${
          isEditing
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isEditing}
        inert={!isEditing}
      >
        <div className="min-h-0 overflow-hidden">
          <ReviewForm
            reviewId={reviewId}
            initialRating={initialRating}
            initialComment={initialComment}
            onCancel={() => closePanel("edit")}
            onSuccess={() => {
              setOpenPanel(null);
              setSuccessMessage("Review updated successfully.");
            }}
          />
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--store-ease-emphasized)] motion-reduce:transition-none ${
          isConfirmingDelete
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isConfirmingDelete}
        inert={!isConfirmingDelete}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            role="group"
            aria-labelledby={confirmationId}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !isDeleting) {
                closePanel("delete");
              }
            }}
            className="mt-4 rounded-ui border border-danger/25 bg-danger/5 p-4"
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
                ref={cancelDeleteButtonRef}
                type="button"
                onClick={() => closePanel("delete")}
                disabled={isDeleting}
                className="inline-flex min-h-10 items-center justify-center rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-border-hover hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <p className="mt-2 text-sm text-green-700" role="status">
          {successMessage}
        </p>
      )}
    </div>
  );
}
