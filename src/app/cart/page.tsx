import { getCurrentUser } from "@/lib/session";
import CartContents from "@/components/CartContents";

export default async function CartPage() {
  const user = await getCurrentUser();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Cart</h1>

      <CartContents isLoggedIn={Boolean(user)} />
    </div>
  );
}
