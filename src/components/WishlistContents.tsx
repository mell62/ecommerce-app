"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type WishlistProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

function isWishlistProduct(value: unknown): value is WishlistProduct {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "price" in value &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    "imageUrl" in value &&
    typeof value.imageUrl === "string"
  );
}

function getStoredWishlist(): WishlistProduct[] {
  const storedWishlist = localStorage.getItem("wishlist");

  if (!storedWishlist) {
    return [];
  }

  try {
    const wishlist: unknown = JSON.parse(storedWishlist);

    return Array.isArray(wishlist) ? wishlist.filter(isWishlistProduct) : [];
  } catch {
    return [];
  }
}

export default function WishlistContents() {
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const [hasLoadedWishlist, setHasLoadedWishlist] = useState(false);

  useEffect(() => {
    const stored = getStoredWishlist();

    /* eslint-disable react-hooks/set-state-in-effect --
     * Load browser-only storage after the component mounts.
     */
    setWishlist(stored);
    setHasLoadedWishlist(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function removeFromWishlist(id: string): void {
    const updated = wishlist.filter((item) => item.id !== id);

    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  }

  if (!hasLoadedWishlist) {
    return <p>Loading wishlist...</p>;
  }

  if (wishlist.length === 0) {
    return (
      <div className="space-y-4">
        <p>Your wishlist is empty.</p>

        <Link
          href="/products"
          className="inline-block bg-black text-white px-4 py-2 rounded"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {wishlist.map((product) => (
        <div key={product.id} className="border rounded-lg p-4 shadow">
          <Link href={`/products/${product.id}`}>
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={800}
              height={600}
              sizes="(min-width: 768px) 33vw, 100vw"
              className="w-full h-48 object-cover rounded"
            />

            <h2 className="text-xl font-semibold mt-4">{product.name}</h2>

            <p className="text-gray-600">{product.description}</p>

            <p className="font-bold mt-2">${product.price}</p>
          </Link>

          <button
            onClick={() => removeFromWishlist(product.id)}
            className="mt-4 bg-red-500 text-white px-3 py-2 rounded"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
