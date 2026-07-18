"use client";

import { formatCartMoney } from "../../_lib/cart";
import { useCart } from "../../_providers/cart-provider";

import { CheckoutPlaceOrderButton } from "./checkout-place-order-button";

export function CheckoutMobileNav() {
  const { pricing } = useCart();

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-4 py-3 shadow-[0_-8px_30px_rgba(10,46,43,0.08)] backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 shrink-0">
          <p className="text-label-sm text-outline">সর্বমোট</p>
          <p className="font-headline-sm text-primary">{formatCartMoney(pricing.total)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <CheckoutPlaceOrderButton className="sm:min-w-[200px]" />
        </div>
      </div>
    </div>
  );
}
