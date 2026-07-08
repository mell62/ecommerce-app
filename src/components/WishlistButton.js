"use client";

import { useEffect, useState } from "react";

export default function WishlistButton({ product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    const found = wishlist.some((item) => item.id === product.id);

    setIsWishlisted(found);
  }, [product.id]);

  function toggleWishlist(event) {
    event.preventDefault();

    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    let updatedWishlist;

    if (isWishlisted) {
      updatedWishlist = wishlist.filter((item) => item.id !== product.id);
    } else {
      updatedWishlist = [...wishlist, product];
    }

    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    setIsWishlisted(!isWishlisted);
  }

  return (
    <button
      onClick={toggleWishlist}
      className="mt-3 rounded border px-3 py-2 text-sm"
    >
      {isWishlisted ? "♥ Wishlisted" : "♡ Add to Wishlist"}
    </button>
  );
}
