"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import type { CheckoutCart } from "../../_data/checkout/checkout";
import { checkoutCopy } from "../../_data/checkout/checkout";

function money(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

const TRUST_ITEMS = [
  { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
  { icon: "verified_user", label: "কোয়ালিটি চেকড" },
  { icon: "assignment_return", label: "৩ দিন রিটার্ন" },
] as const;

export function CheckoutOrderSummary({
  cart,
  className,
  showDesktopButton = true,
}: {
  cart: CheckoutCart;
  className?: string;
  showDesktopButton?: boolean;
}) {
  return (
    <aside className={cn("lg:col-span-5", className)}>
      <div className="sticky top-28 flex flex-col gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_16px_40px_rgba(10,46,43,0.06)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline-sm text-on-surface">{checkoutCopy.summaryTitle}</h2>
          <span className="rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
            {cart.items.length} আইটেম
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-start gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-surface-container ring-1 ring-outline-variant/20">
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <span className="absolute -top-1.5 -right-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-sm">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="font-label-md text-on-surface">{item.title}</h3>
                <p className="mt-0.5 text-label-sm text-outline">{item.meta}</p>
                <p className="mt-2 text-label-sm text-on-surface-variant">
                  {money(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <span className="shrink-0 pt-0.5 font-label-md text-on-surface">
                {money(item.price)}
              </span>
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
            <span className="font-medium text-on-surface">{money(cart.pricing.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-body-md">
            <span className="text-on-surface-variant">ডেলিভারি চার্জ</span>
            <span className="font-medium text-on-surface">{money(cart.pricing.shipping)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-4">
          <span className="font-headline-sm text-on-surface">সর্বমোট</span>
          <span className="font-headline-sm text-primary">{money(cart.pricing.total)}</span>
        </div>

        {showDesktopButton ? (
          <Button className="hidden h-12 w-full rounded-full font-label-md shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98] lg:inline-flex">
            <MaterialIcon name="shopping_bag" className="mr-2 text-[20px]" />
            {checkoutCopy.placeOrder}
          </Button>
        ) : null}

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
