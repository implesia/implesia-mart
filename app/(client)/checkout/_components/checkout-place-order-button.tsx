"use client";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";

import { useCheckoutForm } from "./checkout-form-context";

type CheckoutPlaceOrderButtonProps = {
  className?: string;
  fullWidth?: boolean;
};

export function CheckoutPlaceOrderButton({
  className,
  fullWidth = true,
}: CheckoutPlaceOrderButtonProps) {
  const { status, submitOrder, errorMessage, canSubmit } = useCheckoutForm();
  const submitting = status === "submitting";

  return (
    <div className={cn(fullWidth && "w-full")}>
      <button
        type="button"
        disabled={submitting || !canSubmit}
        onClick={() => {
          void submitOrder();
        }}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80 disabled:opacity-70",
          fullWidth && "w-full",
          className,
        )}
      >
        {submitting ? (
          <>
            <MaterialIcon name="progress_activity" className="mr-1.5 animate-spin text-[18px]" />
            <span className="truncate">পাঠানো হচ্ছে...</span>
          </>
        ) : (
          <>
            <MaterialIcon name="shopping_bag" className="mr-1.5 shrink-0 text-[18px]" />
            <span className="truncate">{checkoutCopy.placeOrder}</span>
          </>
        )}
      </button>
      {status === "error" && errorMessage ? (
        <p className="mt-2 text-center text-xs text-red-500">{errorMessage}</p>
      ) : null}
    </div>
  );
}
