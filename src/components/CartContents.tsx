"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CartContentsProps = {
  isLoggedIn: boolean;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  stockCount: number;
  quantity: number;
};

function isCartItem(value: unknown): value is CartItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "price" in value &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    "originalPrice" in value &&
    typeof value.originalPrice === "number" &&
    Number.isFinite(value.originalPrice) &&
    "imageUrl" in value &&
    typeof value.imageUrl === "string" &&
    "stockCount" in value &&
    typeof value.stockCount === "number" &&
    Number.isInteger(value.stockCount) &&
    "quantity" in value &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  );
}

function parseCart(value: string | null): CartItem[] {
  if (!value) {
    return [];
  }

  try {
    const cart: unknown = JSON.parse(value);

    return Array.isArray(cart) ? cart.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export default function CartContents({ isLoggedIn }: CartContentsProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  function saveCart(updatedCart: CartItem[]): void {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function removeItem(id: string): void {
    const updated = cart.filter((item) => item.id !== id);

    saveCart(updated);
  }

  function updateQuantity(id: string, change: number): void {
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
    async function loadCart(): Promise<void> {
      try {
        const stored = parseCart(localStorage.getItem("cart"));

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

        const data: unknown = await response.json();
        const validatedItems = Array.isArray(data)
          ? data.filter(isCartItem)
          : [];

        setCart(validatedItems);
        localStorage.setItem("cart", JSON.stringify(validatedItems));
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (error) {
        console.error(error);

        setCart(parseCart(localStorage.getItem("cart")));
      } finally {
        setHasLoadedCart(true);
      }
    }

    void loadCart();
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

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const hasStockIssue = cart.some(
    (item) => item.stockCount === 0 || item.quantity > item.stockCount
  );

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
      {hasStockIssue ? (
        <div>
          <p className="mb-3 text-sm text-red-600">
            Please update your cart before checkout.
          </p>

          <button
            disabled
            className="inline-block rounded bg-gray-400 px-4 py-2 text-white cursor-not-allowed"
          >
            Checkout
          </button>
        </div>
      ) : (
        <Link
          href={isLoggedIn ? "/checkout" : "/login?redirect=/checkout"}
          className="inline-block rounded bg-black px-4 py-2 text-white"
        >
          {isLoggedIn ? "Checkout" : "Log In to Checkout"}
        </Link>
      )}
    </div>
  );
}
