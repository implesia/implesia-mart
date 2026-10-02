"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getShopCart,
  removeCartItem,
  setCartItemQuantity,
  syncShopAdd,
  type ShopCart,
} from "@/lib/mart-api/cart";

import {
  CART_STORAGE_KEY,
  clampCartQty,
  computeCartPricing,
  getAvailableProductBySlug,
  readCartFromStorage,
  resolveCartLines,
  sanitizeCartLines,
  writeCartToStorage,
  type CartLineResolved,
  type CartLineStored,
  type CartPricing,
} from "../_lib/cart";

type AddItemOptions = {
  openDrawer?: boolean;
};

type CartContextValue = {
  hydrated: boolean;
  lines: CartLineStored[];
  items: CartLineResolved[];
  pricing: CartPricing;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (open: boolean) => void;
  addItem: (slug: string, quantity?: number, options?: AddItemOptions) => boolean;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function indexShopCart(cart: ShopCart) {
  return new Map(cart.items.map((item) => [item.slug, item.id]));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLineStored[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const remoteItems = useRef(new Map<string, string>());

  useEffect(() => {
    setLines(readCartFromStorage());
    setHydrated(true);
    getShopCart()
      .then((cart) => {
        remoteItems.current = indexShopCart(cart);
      })
      .catch(() => {
        /* The storefront still works from this browser if the API is down. */
      });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeCartToStorage(lines);
  }, [lines, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      setLines(readCartFromStorage());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const setCartOpen = useCallback((open: boolean) => setIsOpen(open), []);

  const addItem = useCallback(
    (slug: string, quantity = 1, options?: AddItemOptions) => {
      if (!getAvailableProductBySlug(slug)) return false;

      const addQty = clampCartQty(quantity);
      setLines((prev) => {
        const existing = prev.find((line) => line.slug === slug);
        if (!existing) {
          return sanitizeCartLines([...prev, { slug, quantity: addQty }]);
        }
        return sanitizeCartLines(
          prev.map((line) =>
            line.slug === slug
              ? { ...line, quantity: clampCartQty(line.quantity + addQty) }
              : line,
          ),
        );
      });

      void syncShopAdd(slug, addQty)
        .then((cart) => {
          if (cart) remoteItems.current = indexShopCart(cart);
        })
        .catch(() => {
          /* Local cart stays. A missing catalog product is not an API product. */
        });

      if (options?.openDrawer !== false) openCart();
      return true;
    },
    [openCart],
  );

  const removeItem = useCallback((slug: string) => {
    const itemId = remoteItems.current.get(slug);
    setLines((prev) => prev.filter((line) => line.slug !== slug));
    if (!itemId) return;
    void removeCartItem(itemId)
      .then((cart) => {
        remoteItems.current = indexShopCart(cart);
      })
      .catch(() => undefined);
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    if (!getAvailableProductBySlug(slug)) return;
    const nextQty = clampCartQty(quantity);
    setLines((prev) =>
      sanitizeCartLines(
        prev.map((line) =>
          line.slug === slug ? { ...line, quantity: nextQty } : line,
        ),
      ),
    );
    const itemId = remoteItems.current.get(slug);
    if (!itemId) return;
    void setCartItemQuantity(itemId, nextQty)
      .then((cart) => {
        remoteItems.current = indexShopCart(cart);
      })
      .catch(() => undefined);
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const items = useMemo(() => resolveCartLines(lines), [lines]);
  const pricing = useMemo(() => computeCartPricing(items), [items]);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      hydrated,
      lines,
      items,
      pricing,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      setCartOpen,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [
      hydrated,
      lines,
      items,
      pricing,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      setCartOpen,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
