"use client";

import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  useEffect(() => {
    async function loadCart() {
      try {
        const stored = JSON.parse(localStorage.getItem("cart")) || [];

        if (stored.length === 0) {
          setCart([]);
          setHasLoadedCart(true);
          return;
        }

        const response = await fetch("/api/cart/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: stored.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load checkout cart");
        }

        const validatedItems = await response.json();

        setCart(validatedItems);
        localStorage.setItem("cart", JSON.stringify(validatedItems));
      } catch (error) {
        console.error(error);

        const stored = JSON.parse(localStorage.getItem("cart")) || [];
        setCart(stored);
      } finally {
        setHasLoadedCart(true);
      }
    }

    loadCart();
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const hasStockIssue = cart.some(
    (item) => item.stockCount === 0 || item.quantity > item.stockCount
  );

  if (!hasLoadedCart) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <p>Loading checkout...</p>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <p>Your cart is empty.</p>
      </main>
    );
  }

  async function placeOrder() {
    if (isPlacingOrder) {
      return;
    }

    try {
      setIsPlacingOrder(true);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      console.log(data);

      localStorage.removeItem("cart");

      alert("Order placed successfully!");

      window.location.href = "/orders?success=true";
    } catch (error) {
      console.error(error);
      alert(error.message);
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
      {hasStockIssue && (
        <p className="mt-4 text-sm text-red-600">
          Some items in your cart are no longer available in the requested
          quantity. Please update your cart before placing the order.
        </p>
      )}
      <button
        onClick={placeOrder}
        disabled={isPlacingOrder || hasStockIssue}
        className="mt-6 px-4 py-2 bg-black text-white disabled:opacity-50"
      >
        {isPlacingOrder ? "Placing Order..." : "Place Order"}
      </button>
    </main>
  );
}
