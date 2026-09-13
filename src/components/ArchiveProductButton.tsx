"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

type ArchiveProductButtonProps = Readonly<{
  productId: string;
  productName: string;
  isArchived: boolean;
}>;

function getArchiveError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Failed to update the product archive status.";
}

export default function ArchiveProductButton({
  productId,
  productName,
  isArchived,
}: ArchiveProductButtonProps) {
  const router = useRouter();
  const errorId = useId();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const nextArchiveState = !isArchived;
  const action = isArchived ? "Restore" : "Archive";

  async function updateArchiveStatus(): Promise<void> {
    setError("");
    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/archive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isArchived: nextArchiveState,
          }),
        }
      );
      const contentType = response.headers.get("content-type");
      const data: unknown = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        setError(getArchiveError(data));
        return;
      }

      router.replace(
        `/admin/products?${nextArchiveState ? "archived" : "restored"}=true`
      );
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
    <div className="max-w-52 sm:text-right">
      <button
        type="button"
        onClick={updateArchiveStatus}
        disabled={isUpdating}
        aria-describedby={error ? errorId : undefined}
        className={`inline-flex min-h-[var(--store-touch-target)] items-center text-sm font-semibold underline decoration-2 underline-offset-4 transition-colors disabled:cursor-wait disabled:opacity-60 ${
          isArchived
            ? "text-brand-700 decoration-brand-100 hover:decoration-brand-500"
            : "text-warning decoration-warning/25 hover:decoration-warning"
        }`}
      >
        {isUpdating ? "Updating..." : `${action} ${productName}`}
      </button>
      {error && (
        <p
          id={errorId}
          className="text-xs leading-5 text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
