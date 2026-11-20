"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialIcon } from "../_components/common/material-icon";
import { useCustomerAuth } from "../_providers/customer-auth-provider";
import {
  getCustomerDashboardSummary,
  getCustomerOrders,
  type CustomerDashboardStats,
  type CustomerOrderSummary,
} from "@/lib/mart-api/customer";
import { formatCartMoney } from "../_lib/cart-shared";
import { cn } from "@/lib/utils";

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
    });
  } catch {
    return iso;
  }
}

export default function DashboardOverviewPage() {
  const { customer } = useCustomerAuth();
  const [stats, setStats] = useState<CustomerDashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [statsData, ordersPage] = await Promise.all([
          getCustomerDashboardSummary().catch(() => null),
          getCustomerOrders({ page: 1, pageSize: 5 }).catch(() => ({ items: [] })),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setRecentOrders(ordersPage.items);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "তথ্য লোড করা যায়নি");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalOrdersCount = stats?.totalOrders ?? recentOrders.length;
  const activeOrdersCount = stats?.activeOrders ?? 0;
  const deliveredOrdersCount = Math.max(0, totalOrdersCount - activeOrdersCount);

  return (
    <div className="space-y-6">
      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Orders Card */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#131c1b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              মোট অর্ডার
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-white/5 dark:text-neutral-300">
              <MaterialIcon name="receipt_long" className="text-[20px]" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl dark:text-white">
              {loading ? "..." : totalOrdersCount}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              সর্বমোট সম্পন্ন ও চলতি অর্ডার
            </p>
          </div>
        </div>

        {/* Active / In-progress Orders Card */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/50 to-white p-5 shadow-xs dark:border-sky-900/40 dark:bg-[#111a20]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
              প্রসেসিং / চলতি অর্ডার
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
              <MaterialIcon name="local_shipping" className="text-[20px]" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl dark:text-sky-100">
              {loading ? "..." : activeOrdersCount}
            </p>
            <p className="mt-1 text-[11px] text-sky-700/80 dark:text-sky-400">
              ডেলিভারির পথে বা প্যাকিং হচ্ছে
            </p>
          </div>
        </div>

        {/* Delivered / Completed Orders Card */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-xs dark:border-emerald-900/40 dark:bg-[#101b18]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              ডেলিভার্ড অর্ডার
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <MaterialIcon name="check_circle" className="text-[20px]" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl dark:text-emerald-100">
              {loading ? "..." : deliveredOrdersCount}
            </p>
            <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400">
              সফলভাবে কাস্টমারের হাতে পৌঁছেছে
            </p>
          </div>
        </div>
      </div>

      {/* Saved Delivery Address Card */}
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#131c1b] sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <MaterialIcon name="home_pin" className="text-[19px]" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-neutral-950 dark:text-white">
                ডিফল্ট ডেলিভারি ঠিকানা
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                চেকআউটে স্বয়ংক্রিয়ভাবে ব্যবহারের জন্য সংরক্ষিত ঠিকানা
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/10"
          >
            <MaterialIcon name="edit" className="text-[15px]" />
            <span>পরিবর্তন করুন</span>
          </Link>
        </div>

        <div className="mt-4 rounded-xl border border-neutral-100 bg-[#fafafa] p-4 text-xs dark:border-white/5 dark:bg-[#172221]">
          {customer?.address || customer?.district ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-neutral-400 dark:text-neutral-500">প্রাপকের নাম:</p>
                <p className="font-semibold text-neutral-900 dark:text-white">{customer.fullName}</p>
              </div>
              <div>
                <p className="text-neutral-400 dark:text-neutral-500">মোবাইল:</p>
                <p className="font-semibold text-neutral-900 dark:text-white">{customer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-neutral-400 dark:text-neutral-500">জেলা ও এলাকা:</p>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {[customer.area, customer.district].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-neutral-400 dark:text-neutral-500">বিস্তারিত ঠিকানা:</p>
                <p className="font-semibold text-neutral-900 dark:text-white">{customer.address || "—"}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">
                এখনও কোনো ডেলিভারি ঠিকানা সংরক্ষণ করা হয়নি।
              </p>
              <Link
                href="/dashboard/profile"
                className="mt-2 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                + এখনই ঠিকানা যোগ করুন
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent Orders Preview Table */}
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#131c1b] sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-neutral-100 text-neutral-800 dark:bg-white/5 dark:text-neutral-200">
              <MaterialIcon name="history" className="text-[19px]" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-neutral-950 dark:text-white">
                সাম্প্রতিক অর্ডারসমূহ
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                আপনার সর্বশেষ ৫টি অর্ডারের বিবরণ
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            <span>সব দেখুন</span>
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            অর্ডারসমূহ লোড হচ্ছে...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-10 text-center">
            <MaterialIcon name="shopping_bag" className="text-[32px] text-neutral-400" />
            <p className="mt-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              এখনও কোনো অর্ডার করেননি
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              আমাদের সেরা অফার ও পণ্যগুলো দেখতে শপিং শুরু করুন।
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              <MaterialIcon name="storefront" className="text-[16px]" />
              <span>পণ্য দেখুন</span>
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] font-semibold text-neutral-400 dark:border-white/5 dark:text-neutral-500">
                  <th className="py-2.5 pr-4">অর্ডার নং</th>
                  <th className="py-2.5 pr-4">তারিখ</th>
                  <th className="py-2.5 pr-4">আইটেম</th>
                  <th className="py-2.5 pr-4">মোট টাকা</th>
                  <th className="py-2.5 pr-4">পেমেন্ট</th>
                  <th className="py-2.5 pr-4">স্ট্যাটাস</th>
                  <th className="py-2.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {recentOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-white/5">
                      <td className="py-3 pr-4 font-bold text-neutral-950 dark:text-white">
                        #{order.number}
                      </td>
                      <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 pr-4 text-neutral-800 dark:text-neutral-200">
                        <div className="flex items-center gap-2">
                          {order.firstItemImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={order.firstItemImage}
                              alt=""
                              className="size-7 rounded-md object-cover ring-1 ring-neutral-200/80 dark:ring-white/10"
                            />
                          ) : null}
                          <span className="max-w-[140px] truncate" title={order.firstItemTitle || ""}>
                            {order.firstItemTitle || `${order.itemsCount}টি আইটেম`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-bold text-neutral-950 dark:text-white">
                        {formatCartMoney(order.total)}
                      </td>
                      <td className="py-3 pr-4 uppercase text-[11px] text-neutral-500">
                        {order.paymentMethod || "COD"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                            badge.className,
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/order-status?order=${encodeURIComponent(order.number)}`}
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          <span>ট্র্যাক</span>
                          <MaterialIcon name="north_east" className="text-[14px]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
