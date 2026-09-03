import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import CheckoutContents from "@/components/CheckoutContents";
import CheckoutPageHeader from "@/components/CheckoutPageHeader";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-[var(--store-container)] px-[var(--store-page-gutter)] py-8 sm:py-10 lg:py-12">
      <CheckoutPageHeader />
      <CheckoutContents initialFullName={user.name} />
    </div>
  );
}
