"use client";

import { useCart } from "@/components/CartProvider";

export default function CartCounter() {
  const { items } = useCart();
  const count = items.reduce((total, item) => total + item.quantity, 0);

  return <span aria-label={`${count} items in cart`}>({count})</span>;
}
