import CheckoutPageHeader from "@/components/CheckoutPageHeader";
import CheckoutSummarySkeleton from "@/components/CheckoutSummarySkeleton";

export default function CheckoutLoading() {
  return (
    <main className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-8 sm:py-10 lg:py-12">
      <CheckoutPageHeader />
      <CheckoutSummarySkeleton />
    </main>
  );
}
