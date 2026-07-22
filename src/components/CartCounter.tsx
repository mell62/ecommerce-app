"use client";

import { useEffect, useState } from "react";

function getCartCount(): number {
  const storedCart = localStorage.getItem("cart");

  if (!storedCart) {
    return 0;
  }

  try {
    const cart: unknown = JSON.parse(storedCart);

    if (!Array.isArray(cart)) {
      return 0;
    }

    return cart.reduce<number>((sum, item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      ) {
        return sum + item.quantity;
      }

      return sum;
    }, 0);
  } catch {
    return 0;
  }
}

export default function CartCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function updateCount(): void {
      setCount(getCartCount());
    }

    updateCount();

    window.addEventListener("cartUpdated", updateCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCount);
    };
  }, []);

  return <span>({count})</span>;
}
