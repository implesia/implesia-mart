"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { formatCartMoney } from "../../_lib/cart-shared";
import { useCart } from "../../_providers/cart-provider";
import { DashboardCard } from "../_components/dashboard-ui";

export default function DashboardCartPage() {
  const {
    hydrated,
    items,
    pricing,
    itemCount,
    adjustQuantity,
    removeItem,
    reloadCart,
  } = useCart();

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <DashboardCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
                আমার কার্ট
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                <MaterialIcon name="cloud_done" className="text-[13px]" />
                <span>অ্যাকাউন্টের সাথে সিঙ্ক করা</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              যেকোনো ডিভাইস থেকে লগইন করলেই আপনার কার্টের পণ্যগুলো স্বয়ংক্রিয়ভাবে পাবেন
            </p>
          </div>

          <button
            type="button"
            onClick={() => void reloadCart()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
          >
            <MaterialIcon name="refresh" className="text-[16px]" />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </DashboardCard>

      {!hydrated ? (
        <DashboardCard className="py-12 text-center text-xs text-neutral-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3">কার্ট লোড হচ্ছে...</p>
        </DashboardCard>
      ) : items.length === 0 ? (
        <DashboardCard className="py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-white/5">
            <MaterialIcon name="shopping_cart" className="text-[30px]" />
          </span>
          <h3 className="mt-3 text-base font-bold text-neutral-900 dark:text-white">
            আপনার কার্টটি বর্তমানে খালি আছে
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            পছন্দের গ্যাজেট ও ফ্যাশন পণ্য কার্টে যুক্ত করে সহজেই অর্ডার করুন।
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800"
          >
            <MaterialIcon name="storefront" className="text-[17px]" />
            <span>পণ্য ব্রাউজ করুন</span>
          </Link>
        </DashboardCard>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* Left: Synced Cart Items */}
          <DashboardCard className="p-0 sm:p-0 overflow-hidden">
            <div className="border-b border-neutral-100 bg-neutral-50/70 px-5 py-3 text-xs font-bold text-neutral-700 dark:border-white/10 dark:bg-white/[0.02] dark:text-neutral-300">
              কার্টে যুক্ত পণ্য ({itemCount} পিস)
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-white/5">
              {items.map((item) => {
                const qtyDiscount = Math.max(
                  0,
                  item.unitPrice * item.quantity - item.lineTotal,
                );
                const atMin = item.quantity <= item.minQuantity;
                const atMax = item.quantity >= item.maxQuantity;

                return (
                  <div
                    key={item.key}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      <Link
                        href={`/products/${item.slug}`}
                        className="shrink-0 overflow-hidden rounded-xl ring-1 ring-neutral-200/80 dark:ring-white/10"
                      >
                        {item.imageSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageSrc}
                            alt={item.imageAlt}
                            className="size-16 object-cover sm:size-18"
                          />
                        ) : (
                          <span className="grid size-16 place-items-center bg-neutral-100 text-neutral-400 sm:size-18 dark:bg-white/5">
                            <MaterialIcon
                              name="inventory_2"
                              className="text-[24px]"
                            />
                          </span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.slug}`}
                          className="line-clamp-2 text-sm font-bold text-neutral-950 hover:text-emerald-700 hover:underline dark:text-white dark:hover:text-emerald-400"
                        >
                          {item.title}
                        </Link>
                        {item.meta ? (
                          <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                            {item.meta}
                          </p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {formatCartMoney(item.unitPrice)} / পিস
                          </span>
                          {typeof item.regularPrice === "number" &&
                          item.regularPrice > item.unitPrice ? (
                            <span className="text-[11px] text-neutral-400 line-through">
                              {formatCartMoney(item.regularPrice)}
                            </span>
                          ) : null}
                        </div>
                        {typeof item.quantityPercent === "number" &&
                        item.quantityPercent > 0 &&
                        qtyDiscount > 0 ? (
                          <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            পরিমাণে {item.quantityPercent}% ছাড়: −
                            {formatCartMoney(qtyDiscount)}
                          </p>
                        ) : null}
                        {!item.available ? (
                          <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            বর্তমানে স্টকে সীমিত বা অনুপলব্ধ
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Controls + Line Total */}
                    <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0 dark:border-white/5">
                      <p className="text-base font-extrabold tabular-nums text-neutral-950 dark:text-white">
                        {formatCartMoney(item.lineTotal)}
                      </p>

                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50/70 p-0.5 dark:border-white/10 dark:bg-white/5">
                          <button
                            type="button"
                            disabled={atMin}
                            onClick={() => adjustQuantity(item.key, -1)}
                            aria-label="পরিমাণ কমান"
                            className="grid size-7 place-items-center rounded-lg text-neutral-700 transition-colors hover:bg-white disabled:opacity-40 dark:text-neutral-200 dark:hover:bg-white/10"
                          >
                            <MaterialIcon name="remove" className="text-[16px]" />
                          </button>
                          <span className="min-w-8 text-center text-xs font-bold tabular-nums text-neutral-950 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={atMax}
                            onClick={() => adjustQuantity(item.key, 1)}
                            aria-label="পরিমাণ বাড়ান"
                            className={cn(
                              "grid size-7 place-items-center rounded-lg text-neutral-700 transition-colors hover:bg-white disabled:opacity-40 dark:text-neutral-200 dark:hover:bg-white/10",
                            )}
                          >
                            <MaterialIcon name="add" className="text-[16px]" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          aria-label={`${item.title} কার্ট থেকে সরান`}
                          title="সরান"
                          className="grid size-8 place-items-center rounded-xl border border-neutral-200 text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 dark:border-white/10 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <MaterialIcon
                            name="delete_outline"
                            className="text-[17px]"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardCard>

          {/* Right: Summary & Checkout CTA */}
          <DashboardCard className="sticky top-[7.5rem]">
            <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
              অর্ডার সারাংশ
            </h3>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                <span>মোট আইটেম</span>
                <span className="font-bold tabular-nums">{itemCount} পিস</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                <span>সাবটোটাল</span>
                <span className="font-bold tabular-nums text-neutral-950 dark:text-white">
                  {formatCartMoney(pricing.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                <span>ডেলিভারি চার্জ</span>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {pricing.shipping > 0
                    ? formatCartMoney(pricing.shipping)
                    : "চেকআউটে নির্ধারিত হবে"}
                </span>
              </div>

              {pricing.ratesConfirmed ? (
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 text-[11px] text-neutral-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                    ডেলিভারি রেট:
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {pricing.insideEnabled ? (
                      <p>ঢাকার ভেতরে: {formatCartMoney(pricing.insideDhaka)}</p>
                    ) : null}
                    {pricing.suburbanEnabled ? (
                      <p>ঢাকা সাব-আর্বান: {formatCartMoney(pricing.dhakaSuburban)}</p>
                    ) : null}
                    {pricing.outsideEnabled ? (
                      <p>ঢাকার বাইরে: {formatCartMoney(pricing.outsideDhaka)}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-sm font-extrabold text-neutral-950 dark:border-white/10 dark:text-white">
                <span>আনুমানিক সর্বমোট</span>
                <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatCartMoney(pricing.total)}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <Link
                href="/checkout"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800"
              >
                <MaterialIcon name="shopping_cart_checkout" className="text-[18px]" />
                <span>চেকআউটে যান</span>
              </Link>
              <Link
                href="/products"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
              >
                <MaterialIcon name="storefront" className="text-[16px]" />
                <span>আরও শপিং করুন</span>
              </Link>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
