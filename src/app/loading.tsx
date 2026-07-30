const productSkeletons = Array.from({ length: 3 }, (_, index) => index);

export default function HomeLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading the Zeus homepage</span>

      <div aria-hidden="true" className="animate-pulse">
        <section className="border-b border-border bg-gradient-to-br from-brand-50 via-surface to-brand-100">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-16 xl:py-12">
            <div>
              <div className="h-12 w-full max-w-xl rounded-ui bg-surface-muted sm:h-16" />
              <div className="mt-5 h-6 w-full max-w-lg rounded-ui bg-surface-muted" />
              <div className="mt-2 h-6 w-4/5 max-w-md rounded-ui bg-surface-muted" />
              <div className="mt-7 flex gap-3">
                <div className="h-12 w-36 rounded-ui bg-brand-200" />
                <div className="h-12 w-36 rounded-ui bg-surface-muted" />
              </div>
            </div>

            <div className="hidden aspect-[4/3] w-full rounded-ui bg-brand-100 lg:block" />
          </div>
        </section>

        <section className="home-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-40 rounded-ui bg-brand-100" />
          <div className="mt-3 h-10 w-72 max-w-full rounded-ui bg-surface-muted" />
          <div className="mt-3 h-5 w-full max-w-xl rounded-ui bg-surface-muted" />

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="h-52 rounded-ui border border-border bg-surface-muted" />
            <div className="h-52 rounded-ui border border-border bg-surface-muted" />
          </div>
        </section>

        <section className="border-y border-border bg-surface-muted">
          <div className="home-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-4 w-36 rounded-ui bg-brand-100" />
            <div className="mt-3 h-10 w-80 max-w-full rounded-ui bg-surface" />
            <div className="mt-3 h-5 w-full max-w-lg rounded-ui bg-surface" />

            <div className="home-product-grid mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {productSkeletons.map((skeleton) => (
                <div
                  key={skeleton}
                  className="overflow-hidden rounded-ui border border-border bg-surface"
                >
                  <div className="aspect-[4/3] bg-brand-50" />
                  <div className="p-4">
                    <div className="h-6 w-2/3 rounded-ui bg-surface-muted" />
                    <div className="mt-3 h-4 w-full rounded-ui bg-surface-muted" />
                    <div className="mt-2 h-4 w-4/5 rounded-ui bg-surface-muted" />
                    <div className="mt-5 h-6 w-24 rounded-ui bg-surface-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
