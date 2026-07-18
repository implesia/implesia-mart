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
    <aside className={cn("lg:col-span-5", className)}>
      <div className="sticky top-28 flex flex-col gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_16px_40px_rgba(10,46,43,0.06)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline-sm text-on-surface">{checkoutCopy.summaryTitle}</h2>
          <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
            {items.length} আইটেম
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.slug} className="flex items-start gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-container ring-1 ring-outline-variant/20">
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-label-md text-on-surface">{item.title}</h3>
                    <p className="mt-0.5 text-label-sm text-outline">{item.meta}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug)}
                    className="rounded-full p-1 text-outline transition-colors hover:bg-surface-container hover:text-red-500"
                    aria-label={`${item.title} সরান`}
                  >
                    <MaterialIcon name="close" className="text-[16px]" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
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
                    <span className="w-7 text-center text-label-sm">{item.quantity}</span>
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
                  <span className="font-label-md text-on-surface">
                    {formatCartMoney(item.lineTotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-primary/5 px-4 py-3 text-body-md text-on-surface-variant">
          <MaterialIcon name="schedule" className="mt-0.5 text-[20px] text-primary" />
          <span>{checkoutCopy.deliveryEta}</span>
        </div>

        <Separator className="bg-outline-variant/30" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-body-md">
            <span className="text-on-surface-variant">সাবটোটাল</span>
            <span className="font-medium text-on-surface">
              {formatCartMoney(pricing.subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-body-md">
            <span className="text-on-surface-variant">ডেলিভারি চার্জ</span>
            <span className="font-medium text-on-surface">
              {formatCartMoney(pricing.shipping)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-4">
          <span className="font-headline-sm text-on-surface">সর্বমোট</span>
          <span className="font-headline-sm text-primary">
            {formatCartMoney(pricing.total)}
          </span>
        </div>

        <div className="hidden lg:block">
          <CheckoutPlaceOrderButton />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-container-low/80 px-2 py-3 text-center"
            >
              <MaterialIcon name={item.icon} className="text-[20px] text-primary" />
              <span className="text-[11px] leading-tight text-on-surface-variant">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-label-sm text-outline">{checkoutCopy.sslNote}</p>
      </div>
    </aside>
  );
}
