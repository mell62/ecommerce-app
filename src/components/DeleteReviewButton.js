"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteReviewButton({ reviewId }) {
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) {
      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete review.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong while deleting the review.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : "Delete review"}
      </button>

      {error && <p>{error}</p>}
    </div>
  );
}
