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

export type CartProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  stockCount: number;
  discountPercent: number;
  quantity: number;
};

type CartContextValue = {
  items: CartProduct[];
  isAuthenticated: boolean;
  isLoading: boolean;
  loadError: string;
  addProduct: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  clearCart: () => void;
};

type CartProviderProps = Readonly<{
  children: ReactNode;
  isAuthenticated: boolean;
}>;

const CartContext = createContext<CartContextValue | null>(null);

function isCartProduct(value: unknown): value is CartProduct {
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
    "originalPrice" in value &&
    typeof value.originalPrice === "number" &&
    "imageUrl" in value &&
    typeof value.imageUrl === "string" &&
    "stockCount" in value &&
    typeof value.stockCount === "number" &&
    "discountPercent" in value &&
    typeof value.discountPercent === "number" &&
    "quantity" in value &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
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

export default function CartProvider({
  children,
  isAuthenticated,
}: CartProviderProps) {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const controller = new AbortController();

    async function loadCart(): Promise<void> {
      try {
        const response = await fetch("/api/cart", {
          signal: controller.signal,
        });
        const data = await getResponseData(response);

        if (!response.ok) {
          throw new Error(getApiError(data, "Failed to load cart."));
        }

        const loadedItems =
          typeof data === "object" &&
          data !== null &&
          "items" in data &&
          Array.isArray(data.items)
            ? data.items.filter(isCartProduct)
            : [];

        setItems(loadedItems);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Failed to load cart."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadCart();

    return () => controller.abort();
  }, [isAuthenticated]);

  const saveReturnedItem = useCallback((data: unknown): void => {
    if (
      typeof data === "object" &&
      data !== null &&
      "item" in data &&
      isCartProduct(data.item)
    ) {
      const returnedItem = data.item;

      setItems((currentItems) => {
        const itemExists = currentItems.some(
          (item) => item.id === returnedItem.id
        );

        return itemExists
          ? currentItems.map((item) =>
              item.id === returnedItem.id ? returnedItem : item
            )
          : [...currentItems, returnedItem];
      });
    }
  }, []);

  const addProduct = useCallback(
    async (productId: string, quantity = 1): Promise<void> => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(getApiError(data, "Failed to add product to cart."));
      }

      saveReturnedItem(data);
    },
    [saveReturnedItem]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number): Promise<void> => {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(getApiError(data, "Failed to update cart quantity."));
      }

      saveReturnedItem(data);
    },
    [saveReturnedItem]
  );

  const removeProduct = useCallback(
    async (productId: string): Promise<void> => {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(
          getApiError(data, "Failed to remove product from cart.")
        );
      }

      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== productId)
      );
    },
    []
  );

  const clearCart = useCallback((): void => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      isAuthenticated,
      isLoading,
      loadError,
      addProduct,
      updateQuantity,
      removeProduct,
      clearCart,
    }),
    [
      items,
      isAuthenticated,
      isLoading,
      loadError,
      addProduct,
      updateQuantity,
      removeProduct,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
