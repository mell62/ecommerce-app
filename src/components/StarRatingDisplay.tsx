type StarRatingDisplayProps = Readonly<{
  rating: number;
}>;

export default function StarRatingDisplay({ rating }: StarRatingDisplayProps) {
  const normalizedRating = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <span
      role="img"
      aria-label={`${normalizedRating} out of 5 stars`}
      className="inline-flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((starValue) => (
        <svg
          key={starValue}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${
            starValue <= normalizedRating ? "text-warning" : "text-border"
          }`}
        >
          <path
            fill="currentColor"
            d="m12 2.8 2.72 5.51 6.08.88-4.4 4.29 1.04 6.05L12 16.67l-5.44 2.86 1.04-6.05-4.4-4.29 6.08-.88L12 2.8Z"
          />
        </svg>
      ))}
    </span>
  );
}
