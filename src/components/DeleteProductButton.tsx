"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

type DeleteProductButtonProps = Readonly<{
  productId: string;
  productName: string;
  canDelete: boolean;
}>;

function getDeleteError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Failed to delete product.";
}

export default function DeleteProductButton({
  productId,
  productName,
  canDelete,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const unavailableDescriptionId = useId();
  const errorId = useId();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteProduct(): Promise<void> {
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      const contentType = response.headers.get("content-type");
      const data: unknown = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        setError(getDeleteError(data));
        return;
      }

      router.replace("/admin/products?deleted=true");
      router.refresh();
    } catch {
      setError(
        "Unable to reach the server. Check your connection and try again."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (!canDelete) {
    return (
      <div className="max-w-52 sm:text-right">
        <button
          type="button"
          disabled
          aria-describedby={unavailableDescriptionId}
          className="inline-flex min-h-[var(--store-touch-target)] cursor-not-allowed items-center text-sm font-semibold text-muted/70"
        >
          Delete unavailable
        </button>
        <p
          id={unavailableDescriptionId}
          className="text-xs leading-5 text-muted"
        >
          Preserved for order history.
        </p>
      </div>
    );
  }

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsConfirming(true);
          setError("");
        }}
        className="inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold text-danger underline decoration-danger/20 decoration-2 underline-offset-4 transition-colors hover:decoration-danger"
      >
        Delete {productName}
      </button>
    );
  }

  return (
    <div
      className="max-w-sm rounded-ui border border-danger/25 bg-danger/5 p-3 sm:text-left"
      role="group"
      aria-label={`Confirm deletion of ${productName}`}
    >
      <p className="text-sm font-semibold text-foreground">
        Delete {productName}?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={deleteProduct}
          disabled={isDeleting}
          aria-describedby={error ? errorId : undefined}
          className="inline-flex min-h-11 items-center justify-center rounded-ui bg-danger px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsConfirming(false);
            setError("");
          }}
          disabled={isDeleting}
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
  );
}
