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
  addCartItem,
  getShopCart,
  lookupProductId,
  removeCartItem,
  setCartItemQuantity,
  type ShopCart,
} from "@/lib/mart-api/cart";
import { MartApiError } from "@/lib/mart-api/products";
import { lineKey } from "@/lib/mart-api/variants";

import { optionSummary } from "../products/_components/purchase-selection";
import {
  clampCartQty,
  type CartLineResolved,
  type CartPricing,
} from "../_lib/cart-shared";

type AddItemOptions = {
  openDrawer?: boolean;
  productId?: string;
  /** Required for a product that has variants. The API prices the line from it. */
  variantId?: string | null;
  selection?: { groupId: string; valueId: string }[];
};

type CartContextValue = {
  hydrated: boolean;
  items: CartLineResolved[];
  pricing: CartPricing;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (open: boolean) => void;
  addItem: (
    slug: string,
    quantity?: number,
    options?: AddItemOptions,
  ) => Promise<boolean>;
  /** The next three take a line key: `item.key`, or `lineKey(slug, variantId)`. */
  removeItem: (key: string) => void;
  adjustQuantity: (key: string, delta: number) => void;
  readQuantity: (key: string) => number;
  reloadCart: () => Promise<void>;
};

const EMPTY_PRICING: CartPricing = {
  subtotal: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  insideDhaka: 0,
  dhakaSuburban: 0,
  outsideDhaka: 0,
  insideEnabled: false,
  suburbanEnabled: false,
  outsideEnabled: false,
  ratesConfirmed: false,
};

const CartContext = createContext<CartContextValue | null>(null);

function applyCart(cart: ShopCart) {
  const items: CartLineResolved[] = cart.items.map((item) => ({
    id: item.productId,
    key: lineKey(item.slug, item.variantId),
    variantId: item.variantId,
    sku: item.sku,
    available: item.available,
    minQuantity: item.minQuantity,
    maxQuantity: item.maxQuantity,
    slug: item.slug,
    title: item.title,
    meta: optionSummary(item.selection ?? []),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    imageSrc: item.imageSrc,
    imageAlt: item.title,
  }));
  const ids = new Map(cart.items.map((item) => [lineKey(item.slug, item.variantId), item.id]));
  const pricing: CartPricing = {
    subtotal: cart.subtotal,
    shipping: cart.shipping,
    tax: 0,
    total: cart.total,
    insideDhaka: cart.insideDhaka,
    dhakaSuburban: cart.dhakaSuburban,
    outsideDhaka: cart.outsideDhaka,
    insideEnabled: cart.insideEnabled,
    suburbanEnabled: cart.suburbanEnabled,
    outsideEnabled: cart.outsideEnabled,
    ratesConfirmed: true,
  };
  return { items, ids, pricing, itemCount: cart.itemCount };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<CartLineResolved[]>([]);
  const [pricing, setPricing] = useState<CartPricing>(EMPTY_PRICING);
  const [itemCount, setItemCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  /** Backend refusals (stock limits) are shown to the shopper; the message never names a count. */
  const showFailure = useCallback((error: unknown) => {
    const message =
      error instanceof MartApiError && error.message
        ? error.message
        : "We couldn't update your cart. Please try again.";
    setNotice(message);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 6000);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    },
    [],
  );
  const ids = useRef(new Map<string, string>());
  const itemsRef = useRef<CartLineResolved[]>([]);
  const pricingRef = useRef<CartPricing>(EMPTY_PRICING);
  const desired = useRef(new Map<string, number>());
  const writes = useRef(new Map<string, number>());
  const epoch = useRef(0);
  const inflight = useRef(0);
  const flight = useRef(0);

  const commit = useCallback((cart: ShopCart) => {
    const next = applyCart(cart);
    ids.current = next.ids;
    itemsRef.current = next.items;
    pricingRef.current = next.pricing;
    setItems(next.items);
    setPricing(next.pricing);
    setItemCount(next.itemCount);
  }, []);

  const publish = useCallback((nextItems: CartLineResolved[]) => {
    const subtotal = nextItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const count = nextItems.reduce((sum, item) => sum + item.quantity, 0);
    const current = pricingRef.current;
    const offered = [
      current.insideEnabled ? current.insideDhaka : null,
      current.suburbanEnabled ? current.dhakaSuburban : null,
      current.outsideEnabled ? current.outsideDhaka : null,
    ].filter((fee): fee is number => fee != null);
    const matched = offered.length > 0 && offered.every((fee) => fee === offered[0]);
    const ship = count > 0 && matched ? offered[0] : 0;
    const pricing = {
      subtotal,
      shipping: ship,
      tax: 0,
      total: subtotal + ship,
      insideDhaka: current.insideDhaka,
      dhakaSuburban: current.dhakaSuburban,
      outsideDhaka: current.outsideDhaka,
      insideEnabled: current.insideEnabled,
      suburbanEnabled: current.suburbanEnabled,
      outsideEnabled: current.outsideEnabled,
      ratesConfirmed: current.ratesConfirmed,
    };
    itemsRef.current = nextItems;
    pricingRef.current = pricing;
    setItems(nextItems);
    setPricing(pricing);
    setItemCount(count);
  }, []);

  const reloadCart = useCallback(async () => {
    const seen = epoch.current;
    const ticket = ++flight.current;
    try {
      const cart = await getShopCart();
      if (
        ticket !== flight.current ||
        seen !== epoch.current ||
        inflight.current > 0
      )
        return;
      commit(cart);
    } catch {
      if (ticket !== flight.current) return;
    } finally {
      if (ticket === flight.current) setHydrated(true);
    }
  }, [commit]);

  useEffect(() => {
    try {
      window.localStorage.removeItem("implesia.cart.v1");
    } catch {
      /* The old slug cart is not the shop cart. */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const seen = epoch.current;
    const ticket = ++flight.current;
    getShopCart()
      .then((cart) => {
        if (
          cancelled ||
          ticket !== flight.current ||
          seen !== epoch.current ||
          inflight.current > 0
        ) {
          return;
        }
        commit(cart);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled && ticket === flight.current) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [commit]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const setCartOpen = useCallback((open: boolean) => setIsOpen(open), []);

  const addItem = useCallback(
    async (slug: string, quantity = 1, options?: AddItemOptions) => {
      const productId = options?.productId || (await lookupProductId(slug));
      if (!productId) return false;
      if (options?.openDrawer !== false) openCart();
      epoch.current += 1;
      inflight.current += 1;
      try {
        commit(await addCartItem(
            productId,
            clampCartQty(quantity),
            options?.selection,
            options?.variantId,
          ));
        return true;
      } catch (error) {
        showFailure(error);
        return false;
      } finally {
        inflight.current -= 1;
      }
    },
    [commit, openCart, showFailure],
  );

  const removeItem = useCallback(
    (key: string) => {
      const itemId = ids.current.get(key);
      if (!itemId) return;
      desired.current.delete(key);
      epoch.current += 1;
      inflight.current += 1;
      publish(itemsRef.current.filter((item) => item.key !== key));
      void removeCartItem(itemId)
        .then((cart) => {
          if (!desired.current.has(key)) commit(cart);
        })
        .catch(() => undefined)
        .finally(() => {
          inflight.current -= 1;
        });
    },
    [commit, publish],
  );

  const readQuantity = useCallback((key: string) => {
    return (
      desired.current.get(key) ??
      itemsRef.current.find((item) => item.key === key)?.quantity ??
      1
    );
  }, []);

  const adjustQuantity = useCallback(
    (key: string, delta: number) => {
      const itemId = ids.current.get(key);
      if (!itemId || !delta) return;
      const line = itemsRef.current.find((item) => item.key === key);
      const current = readQuantity(key);
      const next = clampCartQty(current + delta, {
        min: line?.minQuantity,
        max: line?.maxQuantity,
      });
      if (next === current) return;
      desired.current.set(key, next);
      epoch.current += 1;
      publish(
        itemsRef.current.map((item) =>
          item.key === key
            ? { ...item, quantity: next, lineTotal: item.unitPrice * next }
            : item,
        ),
      );
      const ticket = (writes.current.get(key) ?? 0) + 1;
      writes.current.set(key, ticket);
      window.setTimeout(() => {
        const qty = desired.current.get(key);
        if (qty == null || writes.current.get(key) !== ticket) return;
        inflight.current += 1;
        void setCartItemQuantity(itemId, qty)
          .then((cart) => {
            if (
              writes.current.get(key) !== ticket ||
              desired.current.get(key) !== qty
            )
              return;
            desired.current.delete(key);
            commit(cart);
          })
          .catch((error) => {
            if (writes.current.get(key) !== ticket) return;
            showFailure(error);
            desired.current.delete(key);
            void getShopCart()
              .then(commit)
              .catch(() => undefined);
          })
          .finally(() => {
            inflight.current -= 1;
          });
      }, 160);
    },
    [commit, publish, readQuantity, showFailure],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      hydrated,
      items,
      pricing,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      setCartOpen,
      addItem,
      removeItem,
      adjustQuantity,
      readQuantity,
      reloadCart,
    }),
    [
      hydrated,
      items,
      pricing,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      setCartOpen,
      addItem,
      removeItem,
      adjustQuantity,
      readQuantity,
      reloadCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {notice ? (
        <div
          role="alert"
          data-cart-notice=""
          className="fixed inset-x-3 bottom-4 z-[100] mx-auto max-w-sm rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {notice}
        </div>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
