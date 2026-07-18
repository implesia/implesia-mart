"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLineStored[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLines(readCartFromStorage());
    setHydrated(true);
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

      if (options?.openDrawer !== false) openCart();
      return true;
    },
    [openCart],
  );

  const removeItem = useCallback((slug: string) => {
    setLines((prev) => prev.filter((line) => line.slug !== slug));
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
