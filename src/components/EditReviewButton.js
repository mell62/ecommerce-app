"use client";

import { useEffect, useState } from "react";
import ReviewForm from "@/components/ReviewForm";

export default function EditReviewButton({
  reviewId,
  initialRating,
  initialComment,
}) {
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

  function handleSuccess() {
    setIsEditing(false);
    setSuccessMessage("Review updated successfully.");
  }

  if (isEditing) {
    return (
      <ReviewForm
        reviewId={reviewId}
        initialRating={initialRating}
        initialComment={initialComment}
        onCancel={() => setIsEditing(false)}
        onSuccess={handleSuccess}
      />
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
        className="rounded border px-3 py-1"
      >
        Edit Review
      </button>

      {successMessage && (
        <p className="mt-2 text-sm text-green-700" role="status">
          {successMessage}
        </p>
      )}
    </div>
  );
}
