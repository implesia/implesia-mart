"use client";

import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { formatCartMoney, MAX_CART_QTY } from "../../_lib/cart";
import { useCart } from "../../_providers/cart-provider";
import { checkoutCopy } from "../../_data/checkout/checkout";

import { CheckoutPlaceOrderButton } from "./checkout-place-order-button";

const TRUST_ITEMS = [
  { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
  { icon: "verified_user", label: "কোয়ালিটি চেকড" },
  { icon: "assignment_return", label: "৩ দিন রিটার্ন" },
] as const;

export function CheckoutOrderSummary({ className }: { className?: string }) {
  const { items, pricing, setQuantity, removeItem } = useCart();

  return (
    <aside className={cn("min-w-0 lg:col-span-5", className)}>
      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4",
          "shadow-[0_16px_40px_rgba(10,46,43,0.06)]",
          "sm:gap-5 sm:p-6 lg:sticky lg:top-28 lg:p-8",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-on-surface sm:text-xl">
            {checkoutCopy.summaryTitle}
          </h2>
          <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-1 text-xs text-on-surface-variant sm:px-3 sm:text-sm">
            {items.length} আইটেম
          </span>
        </div>

        <div className="flex max-h-[min(50vh,22rem)] flex-col gap-3.5 overflow-y-auto pr-0.5 sm:max-h-none sm:gap-4 sm:overflow-visible">
          {items.map((item) => (
            <div key={item.slug} className="flex items-start gap-2.5 sm:gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-container ring-1 ring-outline-variant/20 sm:size-20">
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  fill
                  className="object-contain p-1.5"
                  sizes="80px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-medium text-on-surface sm:text-base">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-outline sm:text-sm">
                      {item.meta}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug)}
                    className="shrink-0 rounded-full p-1 text-outline transition-colors hover:bg-surface-container hover:text-red-500"
                    aria-label={`${item.title} সরান`}
                  >
                    <MaterialIcon name="close" className="text-[16px]" />
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 sm:mt-3 sm:gap-3">
                  <div className="inline-flex items-center rounded-full border border-outline-variant/40">
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center hover:text-primary disabled:opacity-40"
                      onClick={() => setQuantity(item.slug, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="পরিমাণ কমান"
                    >
                      <MaterialIcon name="remove" className="text-[16px]" />
                    </button>
                    <span className="w-7 text-center text-xs sm:text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center hover:text-primary disabled:opacity-40"
                      onClick={() => setQuantity(item.slug, item.quantity + 1)}
                      disabled={item.quantity >= MAX_CART_QTY}
                      aria-label="পরিমাণ বাড়ান"
                    >
                      <MaterialIcon name="add" className="text-[16px]" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-on-surface sm:text-base">
                    {formatCartMoney(item.lineTotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-on-surface-variant sm:gap-3 sm:px-4 sm:py-3 sm:text-base">
          <MaterialIcon
            name="schedule"
            className="mt-0.5 shrink-0 text-[18px] text-primary sm:text-[20px]"
          />
          <span className="min-w-0 leading-snug">{checkoutCopy.deliveryEta}</span>
        </div>

        <Separator className="bg-outline-variant/30" />

        <div className="flex flex-col gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
            <span className="text-on-surface-variant">সাবটোটাল</span>
            <span className="font-medium text-on-surface">
              {formatCartMoney(pricing.subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
            <span className="text-on-surface-variant">ডেলিভারি চার্জ</span>
            <span className="font-medium text-on-surface">
              {formatCartMoney(pricing.shipping)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3.5 py-3.5 sm:px-4 sm:py-4">
          <span className="text-base font-semibold text-on-surface sm:text-xl">সর্বমোট</span>
          <span className="text-base font-semibold text-primary sm:text-xl">
            {formatCartMoney(pricing.total)}
          </span>
        </div>

        <div className="hidden lg:block">
          <CheckoutPlaceOrderButton />
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 rounded-xl bg-surface-container-low/80 px-1.5 py-2.5 text-center sm:gap-1.5 sm:px-2 sm:py-3"
            >
              <MaterialIcon name={item.icon} className="text-[18px] text-primary sm:text-[20px]" />
              <span className="text-[10px] leading-tight text-on-surface-variant sm:text-[11px]">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-outline sm:text-xs">{checkoutCopy.sslNote}</p>
      </div>
    </aside>
  );
}
