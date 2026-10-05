"use client";

import Image from "next/image";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import {
  formatCartMoney,
  MAX_CART_QTY,
  offeredDeliveryLabel,
} from "../../_lib/cart-shared";
import { useCart } from "../../_providers/cart-provider";
import { MaterialIcon } from "../common/material-icon";

export function CartDrawer() {
  const {
    hydrated,
    items,
    pricing,
    itemCount,
    isOpen,
    setCartOpen,
    adjustQuantity,
    removeItem,
    closeCart,
  } = useCart();

  const isEmpty = hydrated && items.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        closeLabel="কার্ট বন্ধ করুন"
        className="w-full max-w-full gap-0 border-outline-variant/30 bg-surface-container-lowest p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-outline-variant/25 px-5 py-5 text-left">
          <SheetTitle className="font-headline-sm text-on-background">
            আপনার কার্ট
          </SheetTitle>
          <SheetDescription className="text-body-md text-on-surface-variant">
            {hydrated
              ? itemCount > 0
                ? `${itemCount} টি আইটেম নির্বাচিত`
                : "কার্ট এখনো খালি"
              : "লোড হচ্ছে..."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
              <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon name="shopping_bag" className="text-[32px]" />
              </span>
              <h3 className="mb-2 font-headline-sm text-on-background">
                কার্ট খালি
              </h3>
              <p className="mb-6 max-w-xs text-body-md text-on-surface-variant">
                পছন্দের গ্যাজেট কার্টে যোগ করে সহজেই অর্ডার সম্পন্ন করুন।
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full px-6",
                )}
              >
                প্রোডাক্ট দেখুন
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.slug}
                  className="flex gap-3 rounded-2xl border border-outline-variant/25 bg-surface-container-low/50 p-3"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                    {item.imageSrc ? (
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt || item.title}
                        fill
                        className="object-contain p-1.5"
                        sizes="80px"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="line-clamp-2 font-label-md text-on-surface transition-colors hover:text-primary"
                        >
                          {item.title}
                        </Link>
                        {item.meta ? (
                          <p className="mt-0.5 text-label-sm text-primary">
                            {item.meta}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-label-sm text-outline">
                          {formatCartMoney(item.unitPrice)} / পিস
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.slug)}
                        className="rounded-full p-1 text-outline transition-colors hover:bg-surface-container hover:text-red-500"
                        aria-label={`${item.title} সরান`}
                      >
                        <MaterialIcon name="delete" className="text-[18px]" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div
                        className="inline-flex items-center rounded-full border border-outline-variant/40 bg-surface-container-lowest"
                        role="group"
                        aria-label={`${item.title} এর পরিমাণ`}
                      >
                        <button
                          type="button"
                          className="flex size-11 items-center justify-center text-on-surface focus-visible:outline-2 focus-visible:outline-[#0b5e56] disabled:opacity-40"
                          onClick={() => adjustQuantity(item.slug, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`${item.title} এর পরিমাণ কমান`}
                        >
                          <MaterialIcon name="remove" className="text-[16px]" />
                        </button>
                        <span
                          className="w-8 text-center text-label-sm text-on-surface"
                          aria-live="polite"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex size-11 items-center justify-center text-on-surface focus-visible:outline-2 focus-visible:outline-[#0b5e56] disabled:opacity-40"
                          onClick={() => adjustQuantity(item.slug, 1)}
                          disabled={item.quantity >= MAX_CART_QTY}
                          aria-label={`${item.title} এর পরিমাণ বাড়ান`}
                        >
                          <MaterialIcon name="add" className="text-[16px]" />
                        </button>
                      </div>
                      <span className="font-label-md text-on-surface">
                        {formatCartMoney(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!isEmpty ? (
          <SheetFooter className="border-t border-outline-variant/25 bg-surface-container-lowest px-5 py-5">
            <div className="mb-1 flex items-center justify-between text-body-md">
              <span className="text-on-surface-variant">সাবটোটাল</span>
              <span className="font-medium text-on-surface">
                {formatCartMoney(pricing.subtotal)}
              </span>
            </div>
            <div className="mb-3 flex items-center justify-between text-body-md">
              <span className="text-on-surface-variant">ডেলিভারি</span>
              <span className="font-medium text-on-surface">
                {offeredDeliveryLabel(pricing)}
              </span>
            </div>
            <div className="mb-4 flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <span className="font-label-md text-on-surface">সর্বমোট</span>
              <span className="font-headline-sm text-[#0b5e56]">
                {formatCartMoney(pricing.total)}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 w-full rounded-full font-label-md shadow-lg",
              )}
            >
              <MaterialIcon name="shopping_bag" className="mr-2 text-[20px]" />
              অর্ডার পেজে যান
            </Link>
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-full text-on-surface-variant"
              onClick={closeCart}
            >
              কেনাকাটা চালিয়ে যান
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
