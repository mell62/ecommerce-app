import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import CheckoutContents from "@/components/CheckoutContents";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <CheckoutContents />;
}
