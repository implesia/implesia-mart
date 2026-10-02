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
  lookupProductId,
  removeCartItem,
  setCartItemQuantity,
  whenShopCartSettled,
} from "@/lib/mart-api/cart";
import {
  placeOrder,
  quoteOrder,
  type OrderQuote,
  type QuoteLine,
} from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";

import {
  validateShipping,
  type CheckoutShippingValues,
} from "../../_lib/emailjs";
import { useCart } from "../../_providers/cart-provider";

type OrderSource = "cart" | "direct";

type DirectItem = { productId: string; quantity: number };

type CheckoutFormContextValue = {
  shipping: CheckoutShippingValues;
  setShippingField: <K extends keyof CheckoutShippingValues>(
    key: K,
    value: CheckoutShippingValues[K],
  ) => void;
  paymentMethod: "cod";
  errors: Partial<Record<keyof CheckoutShippingValues, string>>;
  status: "idle" | "submitting" | "success" | "error";
  errorMessage: string | null;
  pricingMessage: string | null;
  pricingBusy: boolean;
  quote: OrderQuote | null;
  quoteReady: boolean;
  deliveryFee: number;
  grandTotal: number;
  deliveryZone: "inside" | "outside";
  orderNumber: string | null;
  canSubmit: boolean;
  changeQuantity: (line: QuoteLine, quantity: number) => void;
  removeLine: (line: QuoteLine) => void;
  submitOrder: () => Promise<boolean>;
  resetStatus: () => void;
};

const CheckoutFormContext = createContext<CheckoutFormContextValue | null>(null);

const initialShipping: CheckoutShippingValues = {
  name: "",
  email: "",
  phone: "",
  district: "",
  area: "",
  address: "",
  notes: "",
};

const emptyQuote: OrderQuote = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  shipping: 0,
  total: 0,
  deliveryZone: "outside",
};

function messageFrom(error: unknown) {
  if (error instanceof MartApiError) return error.message;
  return "অর্ডারের দাম লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।";
}

export function CheckoutFormProvider({
  children,
  source,
  seedSlug,
  seedQty,
}: {
  children: React.ReactNode;
  source: OrderSource;
  seedSlug?: string;
  seedQty?: number;
}) {
  const { reloadCart } = useCart();
  const [shipping, setShipping] = useState<CheckoutShippingValues>(initialShipping);
  const [directItems, setDirectItems] = useState<DirectItem[]>([]);
  const [directReady, setDirectReady] = useState(source !== "direct");
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [pricingBusy, setPricingBusy] = useState(false);
  const [pricingMessage, setPricingMessage] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutShippingValues, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const ticket = useRef(0);
  const busyRef = useRef(false);
  const itemsRef = useRef(directItems);
  itemsRef.current = directItems;

  const setShippingField = useCallback(
    <K extends keyof CheckoutShippingValues>(key: K, value: CheckoutShippingValues[K]) => {
      setShipping((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const refreshQuote = useCallback(
    async (district: string, items: DirectItem[]) => {
      const current = ++ticket.current;
      setPricingBusy(true);
      try {
        if (source === "cart") await whenShopCartSettled();
        const next = await quoteOrder({
          source,
          district,
          items: source === "direct" ? items : undefined,
        });
        if (current !== ticket.current) return null;
        setQuote(next);
        setPricingMessage(next.items.some((line) => !line.available) ? "এক বা একাধিক পণ্য এখন কেনা যাচ্ছে না।" : null);
        return next;
      } catch (error) {
        if (current !== ticket.current) return null;
        setPricingMessage(messageFrom(error));
        return null;
      } finally {
        if (current === ticket.current) setPricingBusy(false);
      }
    },
    [source],
  );

  useEffect(() => {
    if (source !== "direct" || !seedSlug) return;
    let cancelled = false;
    const quantity = Math.min(5, Math.max(1, seedQty ?? 1));
    void lookupProductId(seedSlug).then((productId) => {
      if (cancelled) return;
      if (!productId) {
        setDirectItems([]);
        setQuote(emptyQuote);
        setPricingMessage("এই পণ্যটি এখন অর্ডার করা যাচ্ছে না।");
        setDirectReady(true);
        return;
      }
      setDirectItems([{ productId, quantity }]);
      setDirectReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [source, seedSlug, seedQty]);

  useEffect(() => {
    if (source === "direct" && !directReady) return;
    if (source === "direct" && itemsRef.current.length === 0) return;
    const handle = window.setTimeout(() => {
      void refreshQuote(shipping.district, itemsRef.current);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [source, directReady, shipping.district, directItems, refreshQuote]);

  const changeQuantity = useCallback(
    (line: QuoteLine, quantity: number) => {
      if (busyRef.current || quantity < 1 || quantity > line.maxQuantity) return;
      busyRef.current = true;
      void (async () => {
        try {
          if (source === "cart") {
            if (!line.cartItemId) {
              setPricingMessage("এই লাইনের পরিমাণ এখন বদলানো যাচ্ছে না।");
              return;
            }
            await setCartItemQuantity(line.cartItemId, quantity);
            await reloadCart();
          } else {
            const nextItems = itemsRef.current.map((item) =>
              item.productId === line.productId ? { ...item, quantity } : item,
            );
            setDirectItems(nextItems);
            itemsRef.current = nextItems;
          }
          await refreshQuote(shipping.district, itemsRef.current);
        } catch (error) {
          setPricingMessage(messageFrom(error));
          setPricingBusy(false);
        } finally {
          busyRef.current = false;
        }
      })();
    },
    [refreshQuote, reloadCart, shipping.district, source],
  );

  const removeLine = useCallback(
    (line: QuoteLine) => {
      if (busyRef.current) return;
      busyRef.current = true;
      void (async () => {
        try {
          if (source === "cart") {
            if (!line.cartItemId) return;
            await removeCartItem(line.cartItemId);
            await reloadCart();
            await refreshQuote(shipping.district, itemsRef.current);
            return;
          }
          const nextItems = itemsRef.current.filter((item) => item.productId !== line.productId);
          setDirectItems(nextItems);
          itemsRef.current = nextItems;
          if (nextItems.length === 0) {
            ticket.current += 1;
            setQuote(emptyQuote);
            setPricingBusy(false);
            return;
          }
          await refreshQuote(shipping.district, nextItems);
        } catch (error) {
          setPricingMessage(messageFrom(error));
          setPricingBusy(false);
        } finally {
          busyRef.current = false;
        }
      })();
    },
    [refreshQuote, reloadCart, shipping.district, source],
  );

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const submitOrder = useCallback(async () => {
    const nextErrors = validateShipping(shipping);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setErrorMessage("অনুগ্রহ করে প্রয়োজনীয় তথ্যগুলো সঠিকভাবে পূরণ করুন।");
      return false;
    }
    if (!quote || quote.items.length === 0 || quote.items.some((line) => !line.available)) {
      setStatus("error");
      setErrorMessage("এই অর্ডারটি এখন সম্পন্ন করা যাচ্ছে না।");
      return false;
    }

    setStatus("submitting");
    setErrorMessage(null);
    try {
      const order = await placeOrder({
        source,
        district: shipping.district,
        items: source === "direct" ? itemsRef.current : undefined,
        idempotencyKey: idempotencyKey.current,
        customerName: shipping.name,
        phone: shipping.phone,
        email: shipping.email,
        area: shipping.area,
        address: shipping.address,
        notes: shipping.notes,
      });
      if (source === "cart") await reloadCart();
      setOrderNumber(order.number);
      setStatus("success");
      return true;
    } catch (error) {
      setStatus("error");
      setErrorMessage(messageFrom(error));
      return false;
    }
  }, [quote, reloadCart, shipping, source]);

  const canSubmit = Boolean(
    quote &&
      quote.items.length > 0 &&
      quote.items.every((line) => line.available) &&
      !pricingBusy &&
      status !== "submitting",
  );

  const value = useMemo<CheckoutFormContextValue>(
    () => ({
      shipping,
      setShippingField,
      paymentMethod: "cod",
      errors,
      status,
      errorMessage,
      pricingMessage,
      pricingBusy,
      quote,
      quoteReady: quote !== null || pricingMessage !== null,
      deliveryFee: quote?.shipping ?? 0,
      grandTotal: quote?.total ?? 0,
      deliveryZone: quote?.deliveryZone ?? "outside",
      orderNumber,
      canSubmit,
      changeQuantity,
      removeLine,
      submitOrder,
      resetStatus,
    }),
    [
      shipping,
      setShippingField,
      errors,
      status,
      errorMessage,
      pricingMessage,
      pricingBusy,
      quote,
      orderNumber,
      canSubmit,
      changeQuantity,
      removeLine,
      submitOrder,
      resetStatus,
    ],
  );

  return <CheckoutFormContext.Provider value={value}>{children}</CheckoutFormContext.Provider>;
}

export function useCheckoutForm() {
  const ctx = useContext(CheckoutFormContext);
  if (!ctx) {
    throw new Error("useCheckoutForm must be used within CheckoutFormProvider");
  }
  return ctx;
}
