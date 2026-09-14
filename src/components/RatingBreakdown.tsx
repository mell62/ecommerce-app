export default function RatingBreakdown({
  reviews,
}: Readonly<{
  reviews: readonly { rating: number }[];
}>) {
  const total = reviews.length;
  const average = total
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
    : 0;

  return (
    <section
      aria-label="Rating breakdown"
      className="rounded-ui border border-border bg-surface p-5"
    >
      <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
        {average.toFixed(1)}{" "}
        <span className="text-sm font-normal text-muted">out of 5</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        Based on {total} {total === 1 ? "review" : "reviews"}
      </p>
      <dl className="mt-5 space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviews.filter(
            (review) => review.rating === rating
          ).length;
          return (
            <div key={rating} className="flex items-center gap-3 text-sm">
              <dt className="w-12 shrink-0 text-muted">
                {rating} {rating === 1 ? "star" : "stars"}
              </dt>
              <div
                aria-hidden="true"
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
              >
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                />
              </div>
              <dd className="w-7 text-right font-medium tabular-nums text-foreground">
                {count}
                <span className="sr-only">
                  {" "}
                  {count === 1 ? "review" : "reviews"}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
