"use client";
import Link from "next/link";

import { useEffect, useState } from "react";

export default function CartContents() {
  const [cart, setCart] = useState([]);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  function saveCart(updatedCart) {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function removeItem(id) {
    const updated = cart.filter((item) => item.id !== id);

    saveCart(updated);
  }

  function updateQuantity(id, change) {
    const updated = cart
      .map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity: item.quantity + change,
          };
        }

        return item;
      })
      .filter((item) => item.quantity > 0);

    saveCart(updated);
  }

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
          throw new Error("Failed to load cart");
        }

        const validatedItems = await response.json();

        setCart(validatedItems);
        localStorage.setItem("cart", JSON.stringify(validatedItems));
        window.dispatchEvent(new Event("cartUpdated"));
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

  if (!hasLoadedCart) {
    return <p>Loading cart...</p>;
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-4">
        <p>Your cart is empty.</p>

        <Link
          href="/products"
          className="inline-block bg-black text-white px-4 py-2 rounded"
        >
          Browse Products
        </Link>
      </div>
    );
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

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                className="px-2 border rounded"
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                onClick={() => updateQuantity(item.id, 1)}
                className="px-2 border rounded"
              >
                +
              </button>
            </div>

            {item.stockCount === 0 && (
              <p className="mt-1 text-sm text-red-600">
                This item is currently out of stock.
              </p>
            )}

            {item.stockCount > 0 && item.quantity > item.stockCount && (
              <p className="mt-1 text-sm text-red-600">
                Only {item.stockCount} available.
              </p>
            )}

            <p>${item.price.toFixed(2)}</p>
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
      <Link
        href="/checkout"
        className="inline-block bg-black text-white px-4 py-2 rounded"
      >
        Checkout
      </Link>
    </div>
  );
}
