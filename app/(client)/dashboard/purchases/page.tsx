"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getCustomerPurchasedProducts,
  type PurchasedProductItem,
} from "@/lib/mart-api/customer";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { formatCartMoney } from "../../_lib/cart-shared";
import {
  DashboardCard,
  DashboardOrderStatusBadge,
  formatBanglaDate,
} from "../_components/dashboard-ui";

type PaymentFilter = "all" | "online" | "cod";

const PAYMENT_TABS: { id: PaymentFilter; label: string; icon: string }[] = [
  { id: "all", label: "সকল", icon: "view_list" },
  { id: "online", label: "অনলাইন পেমেন্ট", icon: "qr_code_2" },
  { id: "cod", label: "ক্যাশ অন ডেলিভারি (COD)", icon: "payments" },
];

function isCodMethod(method: string): boolean {
  return method.toLowerCase() === "cod";
}

function getPaymentMethodBadge(method: string): {
  label: string;
  className: string;
} {
  const norm = method.toLowerCase();
  if (norm === "cod") {
    return {
      label: "COD",
      className:
        "bg-neutral-100 text-neutral-700 ring-neutral-300/60 dark:bg-white/10 dark:text-neutral-200 dark:ring-white/15",
    };
  }
  const name =
    norm === "bangla_qr"
      ? "Bangla QR"
      : norm === "bkash"
        ? "bKash"
        : norm === "nagad"
          ? "Nagad"
          : norm === "card"
            ? "Card"
            : "অনলাইন";
  return {
    label: name,
    className:
      "bg-teal-50 text-[#0b5e56] ring-[#2bc0b5]/30 dark:bg-[#0b5e56]/40 dark:text-[#3dd4c8] dark:ring-[#3dd4c8]/30",
  };
}

function getPaymentStatusBadge(status: string): {
  label: string;
  className: string;
} {
  const norm = status.toLowerCase();
  if (norm === "paid") {
    return {
      label: "পরিশোধিত",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300",
    };
  }
  if (norm === "partial") {
    return {
      label: "আংশিক পরিশোধিত",
      className:
        "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/60 dark:text-sky-300",
    };
  }
  if (norm === "cod_due") {
    return {
      label: "COD বাকি",
      className:
        "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300",
    };
  }
  return {
    label: "বাকি",
    className:
      "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300",
  };
}

export default function DashboardPurchasesPage() {
  const [items, setItems] = useState<PurchasedProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getCustomerPurchasedProducts();
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "কেনা পণ্যের হিস্ট্রি লোড করা যায়নি।",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const reviewableIds = new Set(
      items.filter((item) => item.canReview).map((item) => item.productId),
    );
    return {
      lines: items.length,
      totalUnits,
      totalValue,
      reviewableCount: reviewableIds.size,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (paymentFilter === "cod" && !isCodMethod(item.paymentMethod)) {
        return false;
      }
      if (paymentFilter === "online" && isCodMethod(item.paymentMethod)) {
        return false;
      }
      if (q) {
        const titleHit = item.title.toLowerCase().includes(q);
        const orderHit = item.orderNumber.toLowerCase().includes(q);
        if (!titleHit && !orderHit) return false;
      }
      return true;
    });
  }, [items, paymentFilter, search]);

  return (
    <div className="space-y-5">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#131c1b]">
          <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            মোট ক্রয় রেকর্ড
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-neutral-950 dark:text-white">
            {loading ? "..." : summary.lines}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#131c1b]">
          <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            মোট পিস সংখ্যা
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-neutral-950 dark:text-white">
            {loading ? "..." : summary.totalUnits}
          </p>
        </div>
        <div className="rounded-2xl border border-[#2bc0b5]/30 bg-gradient-to-br from-[#d6f7f5]/40 to-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-[#3dd4c8]/25 dark:from-[#0b5e56]/25 dark:to-[#131c1b]">
          <p className="text-[11px] font-semibold text-[#0b5e56] dark:text-[#3dd4c8]">
            মোট পণ্যের মূল্য
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-neutral-950 dark:text-white">
            {loading ? "..." : formatCartMoney(summary.totalValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-amber-900/40 dark:from-amber-950/25 dark:to-[#131c1b]">
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            রিভিউ দেওয়ার বাকি
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-amber-950 dark:text-amber-100">
            {loading ? "..." : summary.reviewableCount}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <DashboardCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
              কেনা পণ্যের হিস্ট্রি
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              কনফার্ম ও ডেলিভারি হওয়া অর্ডারের প্রতিটি পণ্যের তালিকা এবং রিভিউ অপশন
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[17px] text-neutral-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="পণ্য বা অর্ডার নং খুঁজুন..."
                className="h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/70 pr-3 pl-9 text-xs text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white sm:w-52 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#131c1b]"
              />
            </div>

            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-xl border border-neutral-200/90 bg-neutral-100/70 p-1 dark:border-white/10 dark:bg-[#0e1514]">
              {PAYMENT_TABS.map((tab) => {
                const active = paymentFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaymentFilter(tab.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                      active
                        ? "bg-white text-emerald-800 shadow-xs dark:bg-white/10 dark:text-white"
                        : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                    )}
                  >
                    <MaterialIcon name={tab.icon} className="text-[15px]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Purchased Products List */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : loading ? (
        <DashboardCard className="py-12 text-center text-xs text-neutral-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3">কেনা পণ্যের তালিকা লোড হচ্ছে...</p>
        </DashboardCard>
      ) : filteredItems.length === 0 ? (
        <DashboardCard className="py-12 text-center">
          <MaterialIcon
            name="shopping_bag"
            className="text-[36px] text-neutral-400"
          />
          <h3 className="mt-2 text-sm font-bold text-neutral-900 dark:text-white">
            কোনো কেনা পণ্য পাওয়া যায়নি
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {items.length === 0
              ? "আপনার অর্ডার কনফার্ম বা ডেলিভারি হলে কেনা পণ্যগুলো এখানে দেখতে পাবেন।"
              : "অন্য ফিল্টার বা সার্চ শব্দ দিয়ে চেষ্টা করুন।"}
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            <MaterialIcon name="storefront" className="text-[16px]" />
            <span>পণ্য দেখুন</span>
          </Link>
        </DashboardCard>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item, idx) => {
            const methodBadge = getPaymentMethodBadge(item.paymentMethod);
            const statusBadge = getPaymentStatusBadge(item.paymentStatus);

            return (
              <div
                key={`${item.orderNumber}-${item.productId}-${idx}`}
                className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md sm:p-5 dark:border-white/10 dark:bg-[#131c1b]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Product Info */}
                  <div className="flex min-w-0 items-start gap-3.5">
                    <Link
                      href={`/products/${item.slug}`}
                      className="shrink-0 overflow-hidden rounded-xl ring-1 ring-neutral-200/80 dark:ring-white/10"
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="size-16 object-cover transition-transform hover:scale-105 sm:size-18"
                        />
                      ) : (
                        <span className="grid size-16 place-items-center bg-neutral-100 text-neutral-400 sm:size-18 dark:bg-white/5">
                          <MaterialIcon name="inventory_2" className="text-[26px]" />
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

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <Link
                          href={`/dashboard/orders?order=${encodeURIComponent(item.orderNumber)}`}
                          className="font-mono font-bold text-neutral-700 hover:text-emerald-700 hover:underline dark:text-neutral-300 dark:hover:text-emerald-400"
                        >
                          #{item.orderNumber}
                        </Link>
                        <span>•</span>
                        <span>{formatBanglaDate(item.purchasedAt)}</span>
                        <span>•</span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {item.quantity} পিস × {formatCartMoney(item.price)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {item.orderStatus ? (
                          <DashboardOrderStatusBadge status={item.orderStatus} />
                        ) : null}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                            methodBadge.className,
                          )}
                        >
                          {methodBadge.label}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                            statusBadge.className,
                          )}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex flex-col items-start justify-between gap-3 border-t border-neutral-100 pt-3 sm:items-end sm:border-0 sm:pt-0 dark:border-white/5">
                    <div className="sm:text-right">
                      <p className="text-[10px] text-neutral-400">লাইন মূল্য</p>
                      <p className="text-base font-extrabold tabular-nums text-neutral-950 sm:text-lg dark:text-white">
                        {formatCartMoney(item.lineTotal)}
                      </p>
                      {item.dueAmount > 0 ? (
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">
                          অর্ডার বাকি: {formatCartMoney(item.dueAmount)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
                      >
                        <MaterialIcon
                          name="replay"
                          className="text-[15px] text-neutral-500"
                        />
                        <span>আবার কিনুন</span>
                      </Link>

                      {item.canReview ? (
                        <Link
                          href={`/products/${item.slug}?tab=reviews#reviews`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 shadow-xs transition-colors hover:bg-amber-400"
                        >
                          <MaterialIcon name="star" className="text-[15px]" />
                          <span>রিভিউ দিন</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <MaterialIcon
                            name="verified"
                            className="text-[15px]"
                          />
                          <span>রিভিউ দেওয়া হয়েছে</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
