const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export default function ProductsLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading products</span>

      <div aria-hidden="true" className="animate-pulse">
        <header className="mb-8 max-w-3xl sm:min-h-40">
          <div className="h-5 w-28 rounded-ui bg-brand-100" />
          <div className="mt-4 h-12 w-full max-w-lg rounded-ui bg-surface-muted" />
          <div className="mt-4 h-6 w-full max-w-2xl rounded-ui bg-surface-muted" />
          <div className="mt-2 h-6 w-3/4 max-w-xl rounded-ui bg-surface-muted" />
        </header>

        <div className="mb-8 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="h-11 w-14 rounded-ui bg-surface-muted" />
            <div className="h-11 w-28 rounded-ui bg-surface-muted" />
            <div className="h-11 w-24 rounded-ui bg-surface-muted" />
            <div className="h-11 w-20 rounded-ui bg-surface-muted" />
          </div>

          <div className="flex gap-3">
            <div className="h-11 w-24 rounded-ui bg-surface-muted" />
            <div className="h-11 w-36 rounded-ui bg-surface-muted" />
          </div>
        </div>

        <div className="mb-4 h-5 w-32 rounded-ui bg-surface-muted" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonCards.map((card) => (
            <div
              key={card}
              className="overflow-hidden rounded-ui border border-border bg-surface shadow-sm"
            >
              <div className="aspect-[4/3] bg-brand-50" />

              <div className="p-4">
                <div className="h-6 w-2/3 rounded-ui bg-surface-muted" />
                <div className="mt-3 h-4 w-full rounded-ui bg-surface-muted" />
                <div className="mt-2 h-4 w-4/5 rounded-ui bg-surface-muted" />
                <div className="mt-4 h-4 w-1/2 rounded-ui bg-surface-muted" />
                <div className="mt-5 h-6 w-24 rounded-ui bg-surface-muted" />
              </div>

              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <div className="h-4 w-16 rounded-ui bg-surface-muted" />
                <div className="h-11 w-28 rounded-ui bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
