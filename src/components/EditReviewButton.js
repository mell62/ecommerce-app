"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";

export default function EditReviewButton({
  reviewId,
  initialRating,
  initialComment,
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ReviewForm
        reviewId={reviewId}
        initialRating={initialRating}
        initialComment={initialComment}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="rounded border px-3 py-1"
    >
      Edit Review
    </button>
  );
}
