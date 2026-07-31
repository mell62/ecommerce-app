"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWishlist } from "@/components/WishlistProvider";

type WishlistProduct = {
  id: string;
  name: string;
};

type WishlistButtonProps = Readonly<{
  product: WishlistProduct;
}>;

export default function WishlistButton({ product }: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { products, isAuthenticated, isLoading, addProduct, removeProduct } =
    useWishlist();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const isWishlisted = products.some((item) => item.id === product.id);

  async function toggleWishlist(): Promise<void> {
    setError("");

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsUpdating(true);

    try {
      if (isWishlisted) {
        await removeProduct(product.id);
      } else {
        await addProduct(product.id);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update wishlist."
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const isDisabled = isAuthenticated && (isLoading || isUpdating);
  const buttonLabel = isUpdating
    ? isWishlisted
      ? "Removing..."
      : "Saving..."
    : isWishlisted
      ? "Wishlisted"
      : "Wishlist";

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={isDisabled}
        aria-pressed={isWishlisted}
        aria-label={
          isAuthenticated
            ? isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
            : `Log in to add ${product.name} to wishlist`
        }
        className="wishlist-button inline-flex min-h-11 shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-ui border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-border-hover hover:text-brand-700 disabled:cursor-wait disabled:opacity-60"
      >
        <span
          key={isWishlisted ? "wishlisted" : "not-wishlisted"}
          aria-hidden="true"
          className="wishlist-icon-feedback mr-1.5 inline-block text-base text-brand-600"
        >
          {isWishlisted ? "♥" : "♡"}
        </span>
        {isLoading && isAuthenticated ? "Loading..." : buttonLabel}
      </button>

      {error && (
        <p
          className="mt-2 max-w-56 text-right text-xs text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
