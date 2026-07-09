"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function WishlistContents() {
  const [wishlist, setWishlist] = useState([]);
  const [hasLoadedWishlist, setHasLoadedWishlist] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("wishlist")) || [];

    setWishlist(stored);
    setHasLoadedWishlist(true);
  }, []);

  function removeFromWishlist(id) {
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
            <img
              src={product.imageUrl}
              alt={product.name}
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
