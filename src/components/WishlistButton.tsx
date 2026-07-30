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
      type="button"
      onClick={toggleWishlist}
      aria-pressed={isWishlisted}
      aria-label={
        isWishlisted
          ? `Remove ${product.name} from wishlist`
          : `Add ${product.name} to wishlist`
      }
      className="wishlist-button inline-flex min-h-11 shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-ui border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-border-hover hover:text-brand-700"
    >
      <span
        key={isWishlisted ? "wishlisted" : "not-wishlisted"}
        aria-hidden="true"
        className="wishlist-icon-feedback mr-1.5 inline-block text-base text-brand-600"
      >
        {isWishlisted ? "♥" : "♡"}
      </span>
      {isWishlisted ? "Wishlisted" : "Wishlist"}
    </button>
  );
}
