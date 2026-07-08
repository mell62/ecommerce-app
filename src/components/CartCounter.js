"use client";

import { useEffect, useState } from "react";

function getCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export default function CartCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function updateCount() {
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
