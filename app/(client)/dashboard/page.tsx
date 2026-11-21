"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getCustomerDashboardSummary,
  getCustomerNotifications,
  getCustomerOrders,
  markCustomerNotificationRead,
  type CustomerDashboardStats,
  type CustomerNotificationItem,
  type CustomerOrderSummary,
} from "@/lib/mart-api/customer";
import { cn } from "@/lib/utils";

import {
  formatNotificationTime,
  notifyCustomerNotificationsChanged,
} from "../_components/common/customer-notification-bell";
import { MaterialIcon } from "../_components/common/material-icon";
import { formatCartMoney } from "../_lib/cart-shared";
import { useCustomerAuth } from "../_providers/customer-auth-provider";
import {
  DashboardCard,
  DashboardKpiCard,
  DashboardOrderStatusBadge,
  formatBanglaDate,
} from "./_components/dashboard-ui";

export default function DashboardOverviewPage() {
  const { customer } = useCustomerAuth();
  const [stats, setStats] = useState<CustomerDashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<CustomerOrderSummary[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [statsData, ordersPage, notifData] = await Promise.all([
          getCustomerDashboardSummary().catch(() => null),
          getCustomerOrders({ page: 1, pageSize: 5 }).catch(() => ({
            items: [],
          })),
          getCustomerNotifications(5).catch(() => ({
            items: [],
            unreadCount: 0,
          })),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setRecentOrders(ordersPage.items);
        setNotifications(notifData.items);
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

  const totalOrdersCount = stats?.totalOrders ?? 0;
  const activeOrdersCount = stats?.activeOrders ?? 0;
  const deliveredOrdersCount = stats?.deliveredOrders ?? 0;
  const totalProductsPurchased = stats?.totalProductsPurchased ?? 0;
  const totalSpent = stats?.totalSpent ?? 0;
  const unreadNotifications = notifications.filter((item) => !item.isRead);
  const previewNotifications =
    unreadNotifications.length > 0
      ? unreadNotifications.slice(0, 4)
      : notifications.slice(0, 4);

  async function handleNotificationRead(item: CustomerNotificationItem) {
    if (item.isRead) return;
    setNotifications((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)),
    );
    try {
      await markCustomerNotificationRead(item.id);
      notifyCustomerNotificationsChanged();
    } catch {
      /* Ignore transient error */
    }
  }

  return (
    <div className="space-y-6">
      {/* 5 Crisp Admin-Style KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
        <DashboardKpiCard
          label="মোট অর্ডার"
          value={totalOrdersCount}
          hint="সর্বমোট অর্ডার সংখ্যা"
          icon="receipt_long"
          tone="neutral"
          loading={loading}
        />
        <DashboardKpiCard
          label="চলতি / প্রসেসিং"
          value={activeOrdersCount}
          hint="প্যাকিং বা ডেলিভারির পথে"
          icon="local_shipping"
          tone="sky"
          loading={loading}
        />
        <DashboardKpiCard
          label="সফল ডেলিভারি"
          value={deliveredOrdersCount}
          hint="হাতে পৌঁছেছে"
          icon="check_circle"
          tone="emerald"
          loading={loading}
        />
        <DashboardKpiCard
          label="কেনা প্রোডাক্ট"
          value={totalProductsPurchased}
          hint="মোট কেনা পিস"
          icon="shopping_bag"
          tone="amber"
          loading={loading}
        />
        <div className="col-span-2 sm:col-span-1">
          <DashboardKpiCard
            label="সর্বমোট খরচ"
            value={formatCartMoney(totalSpent)}
            hint="মোট সফল ও চলতি ক্রয়"
            icon="payments"
            tone="teal"
            loading={loading}
          />
        </div>
      </div>

      {/* 2-Column Summary Section */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        {/* Left: Recent Orders Table */}
        <DashboardCard>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
                <MaterialIcon name="history" className="text-[19px]" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-neutral-950 dark:text-white">
                  সাম্প্রতিক অর্ডারসমূহ
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  আপনার সর্বশেষ ৫টি অর্ডারের অবস্থা ও ট্র্যাকিং
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/orders"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              <span>সব দেখুন</span>
              <MaterialIcon name="arrow_forward" className="text-[15px]" />
            </Link>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : loading ? (
            <div className="mt-4 space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl bg-neutral-100 dark:bg-white/5"
                />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-white/5">
                <MaterialIcon name="shopping_bag" className="text-[26px]" />
              </span>
              <p className="mt-3 text-sm font-bold text-neutral-800 dark:text-neutral-200">
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
                  <tr className="border-b border-neutral-100 text-[11px] font-semibold text-neutral-400 dark:border-white/10 dark:text-neutral-500">
                    <th className="py-2.5 pr-3">অর্ডার</th>
                    <th className="py-2.5 pr-3">আইটেম</th>
                    <th className="py-2.5 pr-3">মোট</th>
                    <th className="py-2.5 pr-3">স্ট্যাটাস</th>
                    <th className="py-2.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-neutral-50/70 dark:hover:bg-white/[0.03]"
                    >
                      <td className="py-3 pr-3">
                        <Link
                          href={`/dashboard/orders?order=${encodeURIComponent(order.number)}`}
                          className="font-bold text-neutral-950 hover:text-emerald-700 hover:underline dark:text-white dark:hover:text-emerald-400"
                        >
                          #{order.number}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                          {formatBanglaDate(order.createdAt)}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-neutral-800 dark:text-neutral-200">
                        <div className="flex items-center gap-2">
                          {order.firstItemImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={order.firstItemImage}
                              alt=""
                              className="size-8 shrink-0 rounded-lg object-cover ring-1 ring-neutral-200/80 dark:ring-white/10"
                            />
                          ) : null}
                          <div className="min-w-0">
                            <p
                              className="max-w-[130px] truncate font-medium"
                              title={order.firstItemTitle || ""}
                            >
                              {order.firstItemTitle || `${order.itemsCount}টি আইটেম`}
                            </p>
                            <p className="text-[10px] text-neutral-400 uppercase">
                              {order.paymentMethod || "COD"} · {order.itemsCount} পিস
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-bold tabular-nums text-neutral-950 dark:text-white">
                        {formatCartMoney(order.total)}
                      </td>
                      <td className="py-3 pr-3">
                        <DashboardOrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/tracking?order=${encodeURIComponent(order.number)}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950"
                          >
                            <MaterialIcon
                              name="local_shipping"
                              className="text-[13px]"
                            />
                            <span>ট্র্যাক</span>
                          </Link>
                          <Link
                            href={`/dashboard/orders?order=${encodeURIComponent(order.number)}`}
                            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            title="অর্ডারের বিস্তারিত"
                          >
                            <span>বিস্তারিত</span>
                            <MaterialIcon
                              name="chevron_right"
                              className="text-[14px]"
                            />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        {/* Right: Unread Notifications Preview + Default Delivery Address */}
        <div className="space-y-6">
          {/* Unread / Recent Notifications Preview */}
          <DashboardCard>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                  <MaterialIcon name="notifications" className="text-[19px]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-neutral-950 dark:text-white">
                      অপঠিত নোটিফিকেশন
                    </h2>
                    {unreadNotifications.length > 0 ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 tabular-nums dark:bg-rose-950/60 dark:text-rose-300">
                        {unreadNotifications.length}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    অর্ডার ও ডেলিভারি সংক্রান্ত সর্বশেষ আপডেট
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/notifications"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <span>সব দেখুন</span>
              </Link>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2">
                <div className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-white/5" />
                <div className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-white/5" />
              </div>
            ) : previewNotifications.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center dark:border-white/10">
                <MaterialIcon
                  name="mark_email_read"
                  className="text-[24px] text-emerald-600/80 dark:text-emerald-400"
                />
                <p className="mt-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  কোনো নতুন নোটিফিকেশন নেই
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  অর্ডার আপডেট এলেই এখানে দেখা যাবে।
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {previewNotifications.map((item) => (
                  <Link
                    key={item.id}
                    href="/dashboard/notifications"
                    onClick={() => void handleNotificationRead(item)}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5",
                      item.isRead
                        ? "border-neutral-100 bg-neutral-50/40 dark:border-white/5 dark:bg-white/[0.02]"
                        : "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        item.isRead
                          ? "bg-neutral-300 dark:bg-neutral-600"
                          : "bg-emerald-600 dark:bg-emerald-400",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-xs font-bold text-neutral-900 dark:text-white">
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-neutral-400">
                          {formatNotificationTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {item.message}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Default Delivery Address Card */}
          <DashboardCard>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <MaterialIcon name="home_pin" className="text-[19px]" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-neutral-950 dark:text-white">
                    ডিফল্ট ডেলিভারি ঠিকানা
                  </h2>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    চেকআউটে স্বয়ংক্রিয় ব্যবহারের জন্য
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/address"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/10"
              >
                <MaterialIcon name="edit" className="text-[14px]" />
                <span>এডিট</span>
              </Link>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 text-xs dark:border-white/5 dark:bg-white/[0.03]">
              {customer?.address || customer?.district ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-neutral-950 dark:text-white">
                      {customer.fullName}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {customer.phone || "—"}
                    </span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300">
                    {customer.address || "—"}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {[customer.area, customer.district]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-neutral-500 dark:text-neutral-400">
                    এখনও কোনো ডেলিভারি ঠিকানা সংরক্ষণ করা হয়নি।
                  </p>
                  <Link
                    href="/dashboard/address"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    <MaterialIcon name="add_location_alt" className="text-[15px]" />
                    <span>এখনই ঠিকানা যোগ করুন</span>
                  </Link>
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
