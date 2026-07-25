"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";

type WishlistProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

type WishlistButtonProps = Readonly<{
  product: WishlistProduct;
}>;

type StoredWishlistItem = {
  id: string;
};

function isStoredWishlistItem(value: unknown): value is StoredWishlistItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
}

function getStoredWishlist(): StoredWishlistItem[] {
  const storedWishlist = localStorage.getItem("wishlist");

  if (!storedWishlist) {
    return [];
  }

  try {
    const wishlist: unknown = JSON.parse(storedWishlist);

    return Array.isArray(wishlist) ? wishlist.filter(isStoredWishlistItem) : [];
  } catch {
    return [];
  }
}

export default function WishlistButton({ product }: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const wishlist = getStoredWishlist();

    const found = wishlist.some((item) => item.id === product.id);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialize the button from browser storage after the component mounts.
    setIsWishlisted(found);
  }, [product.id]);

  function toggleWishlist(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();

    const wishlist = getStoredWishlist();

    let updatedWishlist: StoredWishlistItem[];

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
