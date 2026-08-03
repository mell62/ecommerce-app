import OrdersPageHeader from "@/components/OrdersPageHeader";

export default function OrdersLoading() {
  return (
    <main className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-8 sm:py-10 lg:py-12">
      <OrdersPageHeader />

      <div className="space-y-6" role="status" aria-label="Loading orders">
        <span className="sr-only">Loading orders...</span>

        {[1, 2].map((order) => (
          <div
            key={order}
            aria-hidden="true"
            className="animate-pulse overflow-hidden rounded-ui border border-border bg-surface shadow-sm"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-muted/35 px-4 py-4 sm:px-6">
              <div>
                <div className="h-5 w-40 rounded bg-surface-muted" />
                <div className="mt-2 h-4 w-28 rounded bg-surface-muted" />
              </div>
              <div className="h-7 w-20 rounded-full bg-surface-muted" />
            </div>

            <div className="flex items-center gap-4 px-4 py-5 sm:px-6">
              <div className="size-16 shrink-0 rounded-ui bg-surface-muted sm:size-20" />
              <div className="min-w-0 flex-1">
                <div className="h-5 w-1/2 rounded bg-surface-muted" />
                <div className="mt-2 h-4 w-36 rounded bg-surface-muted" />
              </div>
              <div className="h-5 w-20 rounded bg-surface-muted" />
            </div>

            <div className="grid gap-3 border-t border-border bg-surface-muted/20 px-4 py-4 sm:grid-cols-4 sm:px-6">
              {[1, 2, 3, 4].map((price) => (
                <div key={price}>
                  <div className="h-4 w-16 rounded bg-surface-muted" />
                  <div className="mt-2 h-5 w-20 rounded bg-surface-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
