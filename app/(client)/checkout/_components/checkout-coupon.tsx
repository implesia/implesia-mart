"use client";

import { couponDisplay } from "@/lib/coupons";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

import { useCheckoutForm } from "./checkout-form-context";

export function CheckoutCoupon() {
  const { couponInput, setCouponInput, applyCoupon, removeCoupon, couponMessage, quote, pricingBusy } =
    useCheckoutForm();
  const state = couponDisplay(quote?.coupon);
  const applied = state.state === "applied";

  return (
    <div className="rounded-2xl bg-[#f5f6f8] p-3">
      <label htmlFor="checkout-coupon" className="text-sm font-medium text-neutral-950">
        Coupon code আছে?
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id="checkout-coupon"
          data-testid="coupon-code"
          value={couponInput}
          onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyCoupon();
            }
          }}
          placeholder="যেমন SAVE10"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          disabled={pricingBusy}
          className="h-11 w-full min-w-0 rounded-full border border-neutral-200 bg-white px-4 text-sm tracking-wide text-neutral-950 uppercase outline-none placeholder:normal-case placeholder:text-neutral-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30 disabled:opacity-60"
        />
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="coupon-apply"
            onClick={applyCoupon}
            disabled={pricingBusy || couponInput.trim().length === 0}
            className="inline-flex h-11 min-w-[7.5rem] flex-1 items-center justify-center rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 sm:flex-none"
          >
            অ্যাপ্লাই
          </button>
          {applied || couponInput.trim() ? (
            <button
              type="button"
              data-testid="coupon-remove"
              onClick={removeCoupon}
              disabled={pricingBusy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
            >
              সরান
            </button>
          ) : null}
        </div>
      </div>
      {couponMessage ? (
        <p role="alert" data-testid="coupon-error" className="mt-2 text-xs leading-relaxed text-red-600">
          {couponMessage}
        </p>
      ) : null}
      {applied ? (
        <p className={cn("mt-2 flex items-center gap-1.5 text-xs text-[#0b5e56]", pricingBusy && "opacity-50")}>
          <MaterialIcon name="sell" className="text-[14px]" />
          <span>
            {state.code} লাগানো হয়েছে
            {state.freeDelivery ? " · ডেলিভারি ফ্রি" : ""}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          কোড দিয়ে অ্যাপ্লাই করলে ছাড় ও নতুন মোট সাথে সাথে দেখাবে।
        </p>
      )}
    </div>
  );
}
