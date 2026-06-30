"use client";

import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart")) || [];

    setCart(stored);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <p>Your cart is empty.</p>
      </main>
    );
  }

  async function placeOrder() {
    try {
      setIsPlacingOrder(true);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "guest-user",
          totalPrice: total,
          items: cart,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const data = await response.json();

      console.log(data);

      localStorage.removeItem("cart");

      alert("Order placed successfully!");

      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="space-y-2 mb-8">
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.name} × {item.quantity}
            </span>

            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="text-xl font-bold">Total: ${total.toFixed(2)}</div>
      <button
        onClick={placeOrder}
        disabled={isPlacingOrder}
        className="mt-6 px-4 py-2 bg-black text-white disabled:opacity-50"
      >
        {isPlacingOrder ? "Placing Order..." : "Place Order"}
      </button>
    </main>
  );
}
