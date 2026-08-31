export default function WishlistPageHeader() {
  return (
    <header className="mb-8 max-w-2xl sm:mb-10">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
        Saved by you
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        Your wishlist
      </h1>
      <p className="mt-3 text-base leading-7 text-muted sm:text-lg">
        Keep track of products you like and return to them when you&apos;re
        ready.
      </p>
    </header>
  );
}
