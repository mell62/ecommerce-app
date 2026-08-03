export default function CheckoutSummarySkeleton() {
  return (
    <div
      className="max-w-3xl rounded-ui border border-border bg-surface p-5 shadow-sm sm:p-6"
      role="status"
      aria-label="Loading checkout"
    >
      <span className="sr-only">Loading checkout...</span>
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-6 w-40 rounded bg-surface-muted" />
        <div className="mt-6 space-y-5">
          {[1, 2].map((skeletonItem) => (
            <div
              key={skeletonItem}
              className="flex items-start justify-between gap-4 border-b border-border pb-5"
            >
              <div className="flex-1">
                <div className="h-5 w-1/2 rounded bg-surface-muted" />
                <div className="mt-2 h-4 w-24 rounded bg-surface-muted" />
              </div>
              <div className="h-5 w-20 rounded bg-surface-muted" />
            </div>
          ))}
        </div>
        <div className="mt-5 ml-auto h-7 w-32 rounded bg-surface-muted" />
        <div className="mt-6 h-11 w-full rounded-ui bg-surface-muted" />
      </div>
    </div>
  );
}
