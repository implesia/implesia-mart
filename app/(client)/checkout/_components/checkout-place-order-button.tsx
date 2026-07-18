"use client";

import { Button } from "@/components/ui/button";
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
  const { status, submitOrder, errorMessage } = useCheckoutForm();
  const submitting = status === "submitting";

  return (
    <div className={cn(fullWidth && "w-full")}>
      <Button
        type="button"
        disabled={submitting}
        onClick={() => {
          void submitOrder();
        }}
        className={cn(
          "h-12 rounded-full font-label-md shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70",
          fullWidth && "w-full",
          className,
        )}
      >
        {submitting ? (
          <>
            <MaterialIcon name="progress_activity" className="mr-2 animate-spin text-[20px]" />
            পাঠানো হচ্ছে...
          </>
        ) : (
          <>
            <MaterialIcon name="shopping_bag" className="mr-2 text-[20px]" />
            {checkoutCopy.placeOrder}
          </>
        )}
      </Button>
      {status === "error" && errorMessage ? (
        <p className="mt-2 text-center text-label-sm text-red-500">{errorMessage}</p>
      ) : null}
    </div>
  );
}
