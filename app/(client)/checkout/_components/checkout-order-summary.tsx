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

export function CheckoutOrderSummary({
  cart,
  className,
}: {
  cart: CheckoutCart;
  className?: string;
}) {
  return (
    <aside className={cn("lg:col-span-5", className)}>
      <div className="sticky top-32 flex flex-col gap-md rounded-2xl border border-border/60 bg-card/80 p-lg shadow-[0_12px_30px_rgba(0,0,0,0.05)] backdrop-blur-sm">
        <h3 className="font-headline-sm text-on-surface">{checkoutCopy.summaryTitle}</h3>

        <div className="flex flex-col gap-md py-md">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-md">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <h4 className="font-label-md text-on-surface">{item.title}</h4>
                <span className="text-label-sm text-outline">{item.meta}</span>
              </div>
              <span className="font-label-md text-on-surface">{money(item.price)}</span>
            </div>
          ))}
        </div>

        <Separator className="bg-surface-container-highest" />

        <div className="flex flex-col gap-sm pt-md">
          <div className="flex items-center justify-between text-body-md">
            <span className="text-on-surface-variant">সাবটোটাল</span>
            <span className="font-medium text-on-surface">{money(cart.pricing.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-body-md">
            <span className="text-on-surface-variant">ডেলিভারি চার্জ</span>
            <span className="font-medium text-on-surface">{money(cart.pricing.shipping)}</span>
          </div>
          {cart.pricing.tax > 0 ? (
            <div className="flex items-center justify-between text-body-md">
              <span className="text-on-surface-variant">ট্যাক্স</span>
              <span className="font-medium text-on-surface">{money(cart.pricing.tax)}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-surface-container-highest pt-md">
          <span className="font-headline-sm text-on-surface">সর্বমোট</span>
          <span className="font-headline-sm text-primary">{money(cart.pricing.total)}</span>
        </div>

        <Button className="h-12 w-full rounded-lg bg-warm-gold font-headline-sm text-on-primary-fixed shadow-[0_10px_20px_rgba(224,164,1,0.28)] hover:bg-[#e0a401] hover:shadow-[0_12px_24px_rgba(224,164,1,0.34)] active:scale-[0.98]">
          {checkoutCopy.placeOrder}
          <MaterialIcon name="arrow_forward" className="ml-2" />
        </Button>

        <p className="mt-sm text-center text-[10px] tracking-widest text-outline uppercase">
          {checkoutCopy.sslNote}
        </p>
      </div>
    </aside>
  );
}

