"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WishlistProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stockCount: number;
  discountPercent: number;
};

type WishlistContextValue = {
  products: WishlistProduct[];
  isAuthenticated: boolean;
  isLoading: boolean;
  loadError: string;
  addProduct: (productId: string) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
};

type WishlistProviderProps = Readonly<{
  children: ReactNode;
  isAuthenticated: boolean;
}>;

const WishlistContext = createContext<WishlistContextValue | null>(null);

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
    "imageUrl" in value &&
    typeof value.imageUrl === "string" &&
    "stockCount" in value &&
    typeof value.stockCount === "number" &&
    "discountPercent" in value &&
    typeof value.discountPercent === "number"
  );
}

function getApiError(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

async function getResponseData(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function WishlistProvider({
  children,
  isAuthenticated,
}: WishlistProviderProps) {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const controller = new AbortController();

    async function loadWishlist(): Promise<void> {
      try {
        const response = await fetch("/api/wishlist", {
          signal: controller.signal,
        });
        const data = await getResponseData(response);

        if (!response.ok) {
          throw new Error(getApiError(data, "Failed to load wishlist."));
        }

        const items =
          typeof data === "object" &&
          data !== null &&
          "items" in data &&
          Array.isArray(data.items)
            ? data.items.filter(isWishlistProduct)
            : [];

        setProducts(items);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Failed to load wishlist."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadWishlist();

    return () => controller.abort();
  }, [isAuthenticated]);

  const addProduct = useCallback(async (productId: string): Promise<void> => {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });
    const data = await getResponseData(response);

    if (!response.ok) {
      throw new Error(getApiError(data, "Failed to add product to wishlist."));
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "item" in data &&
      isWishlistProduct(data.item)
    ) {
      const item = data.item;

      setProducts((currentProducts) => [
        item,
        ...currentProducts.filter((product) => product.id !== item.id),
      ]);
    }
  }, []);

  const removeProduct = useCallback(
    async (productId: string): Promise<void> => {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          getApiError(data, "Failed to remove product from wishlist.")
        );
      }

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId)
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      products,
      isAuthenticated,
      isLoading,
      loadError,
      addProduct,
      removeProduct,
    }),
    [products, isAuthenticated, isLoading, loadError, addProduct, removeProduct]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider.");
  }

  return context;
}
