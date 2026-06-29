"use client";

import { useEffect, useState } from "react";

export default function CartCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const total = cart.reduce((sum, item) => sum + item.quantity, 0);

    setCount(total);
  }, []);

  return <span>({count})</span>;
}
