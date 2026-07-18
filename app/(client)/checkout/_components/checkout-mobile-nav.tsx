"use client";

import { Button } from "@/components/ui/button";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { CheckoutCart } from "../../_data/checkout/checkout";
import { checkoutCopy } from "../../_data/checkout/checkout";

function money(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function CheckoutMobileNav({ cart }: { cart: CheckoutCart }) {
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-4 py-3 shadow-[0_-8px_30px_rgba(10,46,43,0.08)] backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-label-sm text-outline">সর্বমোট</p>
          <p className="font-headline-sm text-primary">{money(cart.pricing.total)}</p>
        </div>
        <Button className="h-12 flex-1 rounded-full px-5 font-label-md shadow-lg active:scale-[0.98] sm:flex-none sm:min-w-[220px]">
          <MaterialIcon name="shopping_bag" className="mr-2 text-[20px]" />
          {checkoutCopy.placeOrder}
        </Button>
      </div>
    </div>
  );
}
