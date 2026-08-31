export default function CheckoutSummarySkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      role="status"
      aria-label="Loading checkout"
    >
      <span className="sr-only">Loading checkout...</span>

      <div
        aria-hidden="true"
        className="animate-pulse rounded-ui border border-border bg-surface p-4 shadow-sm sm:p-6"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="h-6 w-36 rounded bg-surface-muted" />
            <div className="mt-2 h-4 w-24 rounded bg-surface-muted" />
          </div>
          <div className="h-10 w-20 rounded-ui bg-surface-muted" />
        </div>

        <div>
          {[1, 2].map((skeletonItem) => (
            <div
              key={skeletonItem}
              className="flex items-center gap-3 border-b border-border py-5 last:border-0 last:pb-1 sm:gap-4"
            >
              <div className="size-20 shrink-0 rounded-ui bg-surface-muted sm:size-24" />
              <div className="min-w-0 flex-1">
                <div className="h-5 w-2/3 rounded bg-surface-muted" />
                <div className="mt-2 h-4 w-full max-w-32 rounded bg-surface-muted" />
              </div>
              <div className="h-5 w-14 shrink-0 rounded bg-surface-muted sm:w-20" />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="animate-pulse rounded-ui border border-border bg-surface p-5 shadow-sm"
      >
        <div className="h-6 w-36 rounded bg-surface-muted" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((summaryRow) => (
            <div key={summaryRow} className="flex justify-between gap-4">
              <div className="h-4 w-20 rounded bg-surface-muted" />
              <div className="h-4 w-16 rounded bg-surface-muted" />
            </div>
          ))}
        </div>
        <div className="mt-5 h-px bg-border" />
        <div className="mt-5 h-11 w-full rounded-ui bg-surface-muted" />
      </div>
    </div>
  );
}
