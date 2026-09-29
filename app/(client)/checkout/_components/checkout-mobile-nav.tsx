"use client";

import { formatCartMoney } from "../../_lib/cart";

import { CheckoutPlaceOrderButton } from "./checkout-place-order-button";
import { useCheckoutForm } from "./checkout-form-context";

export function CheckoutMobileNav() {
  const { grandTotal } = useCheckoutForm();

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-3 py-2.5 backdrop-blur-lg sm:px-4 sm:py-3 lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 sm:gap-3">
        <div className="min-w-0 shrink-0">
          <p className="text-[10px] text-neutral-500">সর্বমোট</p>
          <p className="text-lg font-semibold tabular-nums text-primary">
            {formatCartMoney(grandTotal)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <CheckoutPlaceOrderButton className="h-11 text-sm" />
        </div>
      </div>
    </div>
  );
}
