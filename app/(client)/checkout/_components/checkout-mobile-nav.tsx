"use client";

import { formatCartMoney } from "../../_lib/cart";
import { useCart } from "../../_providers/cart-provider";

import { CheckoutPlaceOrderButton } from "./checkout-place-order-button";

export function CheckoutMobileNav() {
  const { pricing } = useCart();

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(10,46,43,0.08)] backdrop-blur-lg sm:px-4 sm:py-3 lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 sm:gap-3">
        <div className="min-w-0 shrink-0">
          <p className="text-[10px] text-outline sm:text-xs">সর্বমোট</p>
          <p className="text-lg font-semibold tabular-nums text-primary sm:text-xl">
            {formatCartMoney(pricing.total)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <CheckoutPlaceOrderButton className="h-11 text-sm sm:h-12 sm:text-base" />
        </div>
      </div>
    </div>
  );
}
