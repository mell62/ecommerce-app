"use client";

import { useEffect, useState } from "react";

export default function CartContents() {
  const [cart, setCart] = useState([]);

  function saveCart(updatedCart) {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  }

  function removeItem(id) {
    const updated = cart.filter((item) => item.id !== id);

    saveCart(updated);
  }

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart")) || [];

    setCart(stored);
  }, []);

  if (cart.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-6">
      {cart.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 flex gap-4">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-24 h-24 object-cover rounded"
          />

          <div className="flex-1">
            <h2 className="font-bold">{item.name}</h2>

            <p>Quantity: {item.quantity}</p>

            <p>${item.price}</p>
            <button
              onClick={() => removeItem(item.id)}
              className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="text-xl font-bold">Total: ${total.toFixed(2)}</div>
    </div>
  );
}
