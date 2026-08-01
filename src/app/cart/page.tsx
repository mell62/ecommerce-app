import CartContents from "@/components/CartContents";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight text-foreground">
        Cart
      </h1>

      <CartContents />
    </div>
  );
}
