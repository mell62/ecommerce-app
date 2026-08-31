import WishlistContents from "@/components/WishlistContents";
import WishlistPageHeader from "@/components/WishlistPageHeader";

export default function WishlistPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-8 sm:py-10 lg:py-12">
      <WishlistPageHeader />

      <WishlistContents />
    </div>
  );
}
