"use client";

import { useEffect, useState } from "react";
import ReviewForm from "@/components/ReviewForm";

type EditReviewButtonProps = Readonly<{
  reviewId: string;
  initialRating: number;
  initialComment: string;
}>;

export default function EditReviewButton({
  reviewId,
  initialRating,
  initialComment,
}: EditReviewButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  function handleSuccess(): void {
    setIsEditing(false);
    setSuccessMessage("Review updated successfully.");
  }

  if (isEditing) {
    return (
      <div className="w-full shrink-0">
        <ReviewForm
          reviewId={reviewId}
          initialRating={initialRating}
          initialComment={initialComment}
          onCancel={() => setIsEditing(false)}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setSuccessMessage("");
          setIsEditing(true);
        }}
        className="inline-flex min-h-10 items-center justify-center rounded-ui border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-border-hover hover:text-brand-700"
      >
        Edit review
      </button>

      {successMessage && (
        <p className="mt-2 text-sm text-green-700" role="status">
          {successMessage}
        </p>
      )}
    </div>
  );
}
