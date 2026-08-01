"use client";

import type { SubmitEvent } from "react";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_REVIEW_LENGTH } from "@/lib/review-validation";

type ReviewFormCallbacks = {
  initialRating?: string | number;
  initialComment?: string;
  reviewPlaceholder?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

type ReviewFormProps = Readonly<
  ReviewFormCallbacks &
    (
      | {
          productId: string;
          reviewId?: never;
        }
      | {
          productId?: never;
          reviewId: string;
        }
    )
>;

export default function ReviewForm({
  productId,
  reviewId,
  initialRating = "5",
  initialComment = "",
  reviewPlaceholder = "What stood out to you?",
  onCancel,
  onSuccess,
}: ReviewFormProps) {
  const router = useRouter();
  const isEditing = Boolean(reviewId);
  const headingId = useId();
  const descriptionId = useId();
  const ratingId = useId();
  const commentId = useId();
  const commentHelpId = useId();
  const errorId = useId();

  const [rating, setRating] = useState(String(initialRating));
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setError("");

    if (!comment.trim()) {
      setError("Please enter a review comment.");
      return;
    }

    if (comment.trim().length > MAX_REVIEW_LENGTH) {
      setError(`Review must be ${MAX_REVIEW_LENGTH} characters or fewer.`);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/reviews", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? {
                reviewId,
                rating: Number(rating),
                comment: comment.trim(),
              }
            : {
                productId,
                rating: Number(rating),
                comment: comment.trim(),
              }
        ),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to submit review.";

        setError(message);
        return;
      }

      if (isEditing) {
        router.refresh();
        onSuccess?.();
      } else {
        setRating("5");
        setComment("");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setError(
        isEditing
          ? "Something went wrong while updating the review."
          : "Something went wrong while submitting the review."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={headingId}
      aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
      aria-busy={isSubmitting}
      className={`${isEditing ? "mt-4" : "mt-10"} rounded-ui border border-border bg-surface p-5 shadow-sm sm:p-6`}
    >
      {isEditing ? (
        <h3
          id={headingId}
          className="font-display text-xl font-semibold text-foreground"
        >
          Edit your review
        </h3>
      ) : (
        <h2
          id={headingId}
          className="font-display text-2xl font-semibold text-foreground"
        >
          Leave a review
        </h2>
      )}

      <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
        {isEditing
          ? "Update your rating or share a clearer description of your experience."
          : "Help other customers by sharing your experience with this product."}
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-[15rem_minmax(0,1fr)]">
        <fieldset disabled={isSubmitting}>
          <legend className="text-sm font-semibold text-foreground">
            Your rating
          </legend>
          <div
            className="mt-2 flex"
            onMouseLeave={() => setHoveredRating(null)}
          >
            {[1, 2, 3, 4, 5].map((starValue) => {
              const previewRating = hoveredRating ?? Number(rating);
              const isFilled = starValue <= previewRating;

              return (
                <label
                  key={starValue}
                  className={`group/star inline-flex h-11 w-11 items-center justify-center ${
                    isSubmitting ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                  onMouseEnter={() => setHoveredRating(starValue)}
                >
                  <input
                    id={`${ratingId}-${starValue}`}
                    type="radio"
                    name={ratingId}
                    value={starValue}
                    checked={rating === String(starValue)}
                    onChange={(event) => setRating(event.target.value)}
                    className="peer sr-only"
                  />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className={`h-8 w-8 transition duration-200 ease-[var(--store-ease-emphasized)] group-hover/star:scale-110 peer-focus-visible:rounded-sm peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 ${
                      isFilled ? "text-warning" : "text-border-hover"
                    }`}
                  >
                    <path
                      fill="currentColor"
                      d="m12 2.8 2.72 5.51 6.08.88-4.4 4.29 1.04 6.05L12 16.67l-5.44 2.86 1.04-6.05-4.4-4.29 6.08-.88L12 2.8Z"
                    />
                  </svg>
                  <span className="sr-only">
                    {starValue} {starValue === 1 ? "star" : "stars"}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-sm text-muted">{rating} out of 5 stars</p>
        </fieldset>

        <div>
          <label
            htmlFor={commentId}
            className="text-sm font-semibold text-foreground"
          >
            Your review
          </label>
          <textarea
            id={commentId}
            aria-describedby={commentHelpId}
            placeholder={reviewPlaceholder}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setError("");
            }}
            disabled={isSubmitting}
            required
            maxLength={MAX_REVIEW_LENGTH}
            className="store-field mt-2 min-h-32 w-full resize-none rounded-ui border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface-muted"
            rows={4}
          />
          <p id={commentHelpId} className="mt-1 text-right text-xs text-muted">
            {comment.length.toLocaleString()} /{" "}
            {MAX_REVIEW_LENGTH.toLocaleString()} characters
          </p>
        </div>
      </div>

      {error && (
        <p id={errorId} className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Submitting..."
            : isEditing
              ? "Save changes"
              : "Submit review"}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border bg-surface px-5 py-2.5 font-semibold text-foreground shadow-sm hover:border-border-hover hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
