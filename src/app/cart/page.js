import CartContents from "@/components/CartContents";

export default function CartPage() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      <CartContents />
    </div>
  );
}
