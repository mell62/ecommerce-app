import type { Review } from "@prisma/client";
import ReviewActions from "@/components/ReviewActions";
import StarRatingDisplay from "@/components/StarRatingDisplay";

export default function ReviewList({
  reviews,
  userId,
  compactPreview = false,
}: Readonly<{
  reviews: Review[];
  userId?: string;
  compactPreview?: boolean;
}>) {
  return (
    <div className="min-w-0 space-y-4">
      {reviews.map((review, index) => (
        <article
          id={`review-${review.id}`}
          key={review.id}
          className={`min-w-0 rounded-ui border border-border bg-surface p-5 shadow-sm sm:p-6 ${compactPreview && index >= 3 ? "hidden lg:block" : ""}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display font-semibold uppercase text-brand-700"
              >
                {review.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{review.name}</p>
                  {userId === review.userId && (
                    <span className="rounded-ui bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      Your review
                    </span>
                  )}
                </div>
                <time
                  dateTime={review.createdAt.toISOString()}
                  className="text-xs text-muted"
                >
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(review.createdAt)}
                </time>
              </div>
            </div>

            <StarRatingDisplay rating={review.rating} />
          </div>

          <p className="mt-4 whitespace-pre-wrap [overflow-wrap:anywhere] leading-7 text-muted">
            {review.comment}
          </p>

          {userId === review.userId && (
            <ReviewActions
              reviewId={review.id}
              initialRating={review.rating}
              initialComment={review.comment}
            />
          )}
        </article>
      ))}
    </div>
  );
}
