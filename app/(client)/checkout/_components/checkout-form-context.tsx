"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  sendOrderEmail,
  validateShipping,
  type CheckoutShippingValues,
} from "../../_lib/emailjs";
import { useCart } from "../../_providers/cart-provider";

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

export function CheckoutFormProvider({ children }: { children: React.ReactNode }) {
  const { items, pricing, clearCart } = useCart();
  const [shipping, setShipping] = useState<CheckoutShippingValues>(initialShipping);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CheckoutShippingValues, string>>
  >({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setShippingField = useCallback(
    <K extends keyof CheckoutShippingValues>(
      key: K,
      value: CheckoutShippingValues[K],
    ) => {
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

    if (items.length === 0) {
      setStatus("error");
      setErrorMessage("কার্টে কোনো আইটেম নেই।");
      return false;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      await sendOrderEmail({
        shipping,
        paymentMethod: "ক্যাশ অন ডেলিভারি (COD)",
        items,
        pricing,
      });
      clearCart();
      setShipping(initialShipping);
      setStatus("success");
      return true;
    } catch (error) {
      console.error("EmailJS order failed:", error);
      setStatus("error");
      setErrorMessage(
        "অর্ডার পাঠাতে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন অথবা আমাদের সাথে যোগাযোগ করুন।",
      );
      return false;
    }
  }, [shipping, items, pricing, clearCart]);

  const value = useMemo<CheckoutFormContextValue>(
    () => ({
      shipping,
      setShippingField,
      paymentMethod: "cod",
      errors,
      status,
      errorMessage,
      submitOrder,
      resetStatus,
    }),
    [
      shipping,
      setShippingField,
      errors,
      status,
      errorMessage,
      submitOrder,
      resetStatus,
    ],
  );

  return (
    <CheckoutFormContext.Provider value={value}>{children}</CheckoutFormContext.Provider>
  );
}

export function useCheckoutForm() {
  const ctx = useContext(CheckoutFormContext);
  if (!ctx) {
    throw new Error("useCheckoutForm must be used within CheckoutFormProvider");
  }
  return ctx;
}
