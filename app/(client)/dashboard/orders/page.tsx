"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  getCustomerOrders,
  type CustomerOrderSummary,
} from "@/lib/mart-api/customer";
import { formatCartMoney } from "../../_lib/cart-shared";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "running" | "delivered" | "cancelled";

const TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: "all", label: "সকল অর্ডার", icon: "view_list" },
  { id: "running", label: "রানিং অর্ডার", icon: "local_shipping" },
  { id: "delivered", label: "ডেলিভার্ড", icon: "check_circle" },
  { id: "cancelled", label: "বাতিল", icon: "cancel" },
];

function getStatusBadge(status: string) {
  const norm = status.toLowerCase();
  if (norm === "delivered") {
    return {
      label: "ডেলিভার্ড",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300",
    };
  }
  if (["new", "confirmed", "packed", "shipped"].includes(norm)) {
    return {
      label: norm === "shipped" ? "অন-ডেলিভারি" : norm === "packed" ? "প্যাকিং চলছে" : "প্রসেসিং",
      className: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-300",
    };
  }
  if (norm === "cancelled") {
    return {
      label: "বাতিল",
      className: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300",
    };
  }
  if (norm === "returned") {
    return {
      label: "ফেরত এসেছে",
      className: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300",
    };
  }
  return {
    label: status,
    className: "bg-neutral-100 text-neutral-700 ring-neutral-400/20 dark:bg-white/10 dark:text-neutral-300",
  };
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrderSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCustomerOrders({ page: 1, pageSize: 50 });
        if (cancelled) return;
        setOrders(data.items);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "অর্ডারের তালিকা লোড করা যায়নি");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    if (activeTab === "running") {
      return orders.filter((o) =>
        ["new", "confirmed", "packed", "shipped"].includes(o.status.toLowerCase()),
      );
    }
    if (activeTab === "delivered") {
      return orders.filter((o) => o.status.toLowerCase() === "delivered");
    }
    if (activeTab === "cancelled") {
      return orders.filter((o) =>
        ["cancelled", "returned"].includes(o.status.toLowerCase()),
      );
    }
    return orders;
  }, [orders, activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#131c1b] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
              আমার অর্ডারসমূহ
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              আপনার সমস্ত কেনাকাটা ও ডেলিভারি স্ট্যাটাস ট্র্যাক করুন
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-xl border border-neutral-200/90 bg-neutral-100/70 p-1 dark:border-white/10 dark:bg-[#0e1514]">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "bg-white text-emerald-800 shadow-xs dark:bg-white/10 dark:text-white"
                      : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                  )}
                >
                  <MaterialIcon name={tab.icon} className="text-[16px]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-12 text-center text-xs text-neutral-500 dark:border-white/10 dark:bg-[#131c1b]">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3">অর্ডার লোড হচ্ছে...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-12 text-center shadow-xs dark:border-white/10 dark:bg-[#131c1b]">
          <MaterialIcon name="inbox" className="text-[36px] text-neutral-400" />
          <h2 className="mt-2 text-sm font-bold text-neutral-900 dark:text-white">
            কোনো অর্ডার পাওয়া যায়নি
          </h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {activeTab === "all"
              ? "আপনি এখনও কোনো অর্ডার করেননি।"
              : "এই ক্যাটাগরিতে বর্তমানে কোনো অর্ডার নেই।"}
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            <MaterialIcon name="storefront" className="text-[16px]" />
            <span>শপিং শুরু করুন</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-xs transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#131c1b]"
              >
                {/* Order Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-[#fafafa] px-5 py-3 text-xs dark:border-white/5 dark:bg-[#16201f]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-neutral-950 dark:text-white">
                      #{order.number}
                    </span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Order Card Body */}
                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                      {order.firstItemImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={order.firstItemImage}
                          alt=""
                          className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-neutral-200/80 dark:ring-white/10"
                        />
                      ) : (
                        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-white/5">
                          <MaterialIcon name="inventory_2" className="text-[24px]" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-neutral-900 dark:text-white">
                          {order.firstItemTitle || `অর্ডার #${order.number}`}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>মোট {order.itemsCount}টি আইটেম</span>
                          <span>•</span>
                          <span className="uppercase font-medium text-neutral-700 dark:text-neutral-300">
                            পেমেন্ট: {order.paymentMethod || "COD"}
                          </span>
                        </div>
                        {order.courierName ? (
                          <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                            কুরিয়ার: <strong>{order.courierName}</strong>
                            {order.trackingNumber ? ` (ট্র্যাকিং: ${order.trackingNumber})` : ""}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <p className="text-[11px] text-neutral-400">সর্বমোট প্রদেয়</p>
                      <p className="text-lg font-black text-neutral-950 sm:text-xl dark:text-white">
                        {formatCartMoney(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 border-t border-neutral-100 pt-3.5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
                    >
                      <MaterialIcon name="receipt" className="text-[16px] text-neutral-500" />
                      <span>রসিদ / বিবরণ</span>
                    </button>

                    <Link
                      href={`/order-status?order=${encodeURIComponent(order.number)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-800"
                    >
                      <MaterialIcon name="local_shipping" className="text-[16px]" />
                      <span>ট্র্যাকিং দেখুন</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#141d1c]">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <MaterialIcon name="receipt_long" className="text-[20px] text-emerald-700" />
                <h2 className="text-base font-bold text-neutral-950 dark:text-white">
                  অর্ডার বিবরণ (#{selectedOrder.number})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-500">অর্ডার তারিখ:</span>
                <span className="font-semibold">{formatDate(selectedOrder.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-500">আইটেম সংখ্যা:</span>
                <span className="font-semibold">{selectedOrder.itemsCount}টি</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-500">পেমেন্ট পদ্ধতি:</span>
                <span className="uppercase font-semibold">{selectedOrder.paymentMethod || "COD"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-500">কুরিয়ার:</span>
                <span className="font-semibold">{selectedOrder.courierName || "নির্ধারিত হয়নি"}</span>
              </div>
              {selectedOrder.trackingNumber ? (
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                  <span className="text-neutral-500">ট্র্যাকিং কোড:</span>
                  <span className="font-mono font-semibold">{selectedOrder.trackingNumber}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-2 text-sm font-bold text-neutral-950 dark:text-white">
                <span>সর্বমোট বিল:</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {formatCartMoney(selectedOrder.total)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/10"
              >
                বন্ধ করুন
              </button>
              <Link
                href={`/order-status?order=${encodeURIComponent(selectedOrder.number)}`}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                লাইভ ট্র্যাকিং পাতা
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
