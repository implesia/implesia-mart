"use client";

import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";
import { formatCartMoney } from "../../_lib/cart";

import { CheckoutPlaceOrderButton } from "./checkout-place-order-button";
import { useCheckoutForm } from "./checkout-form-context";

const TRUST_ITEMS = [
  { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
  { icon: "public", label: "সারাদেশে ডেলিভারি" },
  { icon: "assignment_return", label: "৩ দিন রিটার্ন" },
] as const;

export function CheckoutOrderSummary({ className }: { className?: string }) {
  const {
    quote,
    deliveryFee,
    grandTotal,
    deliveryZone,
    pricingBusy,
    pricingMessage,
    changeQuantity,
    removeLine,
  } = useCheckoutForm();
  const items = quote?.items ?? [];

  return (
    <aside className={cn("min-w-0 lg:col-span-5", className)}>
      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90",
          "sm:p-5 lg:sticky lg:top-28",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            {checkoutCopy.summaryTitle}
          </h2>
          <span className="shrink-0 rounded-full bg-[#f5f6f8] px-2.5 py-1 text-xs text-neutral-600">
            {items.length} আইটেম
          </span>
        </div>

        <div className="flex max-h-[min(50vh,22rem)] flex-col gap-3.5 overflow-y-auto pr-0.5 sm:max-h-none sm:overflow-visible">
          {items.map((item) => (
            <div key={item.productId} className="flex items-start gap-2.5 sm:gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f5f6f8] ring-1 ring-neutral-200/90 sm:size-20">
                {item.imageSrc ? (
                  <Image
                    src={item.imageSrc}
                    alt={item.title}
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-medium text-neutral-950">{item.title}</h3>
                    {item.available ? null : (
                      <p className="mt-0.5 text-xs text-red-500">এখন কেনা যাচ্ছে না</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(item)}
                    disabled={pricingBusy}
                    className="shrink-0 rounded-full p-1 text-neutral-400 transition-colors hover:bg-[#f5f6f8] hover:text-red-500 disabled:opacity-40"
                    aria-label={`${item.title} সরান`}
                  >
                    <MaterialIcon name="close" className="text-[16px]" />
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-full border border-neutral-200">
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center hover:text-primary disabled:opacity-40"
                      onClick={() => changeQuantity(item, item.quantity - 1)}
                      disabled={pricingBusy || item.quantity <= 1}
                      aria-label="পরিমাণ কমান"
                    >
                      <MaterialIcon name="remove" className="text-[16px]" />
                    </button>
                    <span className="w-7 text-center text-xs">{item.quantity}</span>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center hover:text-primary disabled:opacity-40"
                      onClick={() => changeQuantity(item, item.quantity + 1)}
                      disabled={pricingBusy || !item.available || item.quantity >= item.maxQuantity}
                      aria-label="পরিমাণ বাড়ান"
                    >
                      <MaterialIcon name="add" className="text-[16px]" />
                    </button>
                  </div>
                  <span className={cn("text-sm font-semibold text-neutral-950", pricingBusy && "opacity-50")}>
                    {formatCartMoney(item.lineTotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border-l-4 border-primary bg-[#f5f6f8] px-3 py-2.5 text-sm text-neutral-600">
          <MaterialIcon name="schedule" className="mt-0.5 shrink-0 text-[18px] text-primary" />
          <span className="min-w-0 leading-snug">{checkoutCopy.deliveryEta}</span>
        </div>

        <Separator className="bg-neutral-200" />

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-neutral-600">সাবটোটাল</span>
            <span className={cn("font-medium text-neutral-950", pricingBusy && "opacity-50")}>
              {formatCartMoney(quote?.subtotal ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-neutral-600">
              ডেলিভারি চার্জ
              <span className="mt-0.5 block text-[11px] text-neutral-400">
                {deliveryZone === "inside" ? "ঢাকার ভেতর" : "ঢাকার বাইরে"}
              </span>
            </span>
            <span className={cn("font-medium text-neutral-950", pricingBusy && "opacity-50")}>
              {formatCartMoney(deliveryFee)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f5f6f8] px-3.5 py-3.5">
          <span className="text-base font-semibold text-neutral-950">সর্বমোট</span>
          <span className={cn("text-base font-semibold text-primary", pricingBusy && "opacity-50")}>
            {formatCartMoney(grandTotal)}
          </span>
        </div>
        {pricingMessage ? <p className="text-center text-xs text-red-500">{pricingMessage}</p> : null}

        <div className="hidden lg:block">
          <CheckoutPlaceOrderButton />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 rounded-xl bg-[#f5f6f8] px-1.5 py-2.5 text-center"
            >
              <MaterialIcon name={item.icon} className="text-[18px] text-primary" />
              <span className="text-[10px] leading-tight text-neutral-600">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-neutral-500">{checkoutCopy.sslNote}</p>
      </div>
    </aside>
  );
}
