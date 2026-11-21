"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  deleteCustomerNotification,
  getCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
  type CustomerNotificationItem,
} from "@/lib/mart-api/customer";
import { cn } from "@/lib/utils";

import {
  formatNotificationTime,
  notifyCustomerNotificationsChanged,
} from "../../_components/common/customer-notification-bell";
import { MaterialIcon } from "../../_components/common/material-icon";
import { DashboardCard, formatBanglaDate } from "../_components/dashboard-ui";

type FilterTab = "all" | "unread";

const ORDER_NUMBER_RE = /#(IM-[A-Z0-9]+|[A-Z]{2,5}-[A-Z0-9]+)/i;

function extractOrderNumber(item: CustomerNotificationItem): string | null {
  const match =
    item.message.match(ORDER_NUMBER_RE) ?? item.title.match(ORDER_NUMBER_RE);
  return match?.[1]?.toUpperCase() ?? null;
}

export default function DashboardNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CustomerNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getCustomerNotifications(50);
        if (!cancelled) setItems(data.items);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "নোটিফিকেশন লোড করা যায়নি।",
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

  const unreadCount = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items],
  );

  const visibleItems = useMemo(
    () => (filter === "unread" ? items.filter((item) => !item.isRead) : items),
    [items, filter],
  );

  async function handleMarkAllRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllCustomerNotificationsRead();
      setItems((prev) => prev.map((row) => ({ ...row, isRead: true })));
      notifyCustomerNotificationsChanged();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "সব নোটিফিকেশন পঠিত করা যায়নি।",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkOneRead(id: string) {
    setBusyId(id);
    try {
      await markCustomerNotificationRead(id);
      setItems((prev) =>
        prev.map((row) => (row.id === id ? { ...row, isRead: true } : row)),
      );
      notifyCustomerNotificationsChanged();
    } catch {
      /* Ignore transient error */
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteCustomerNotification(id);
      setItems((prev) => prev.filter((row) => row.id !== id));
      notifyCustomerNotificationsChanged();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "নোটিফিকেশন মুছা যায়নি।",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleCardClick(item: CustomerNotificationItem) {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)),
      );
      try {
        await markCustomerNotificationRead(item.id);
        notifyCustomerNotificationsChanged();
      } catch {
        /* Proceed with navigation */
      }
    }

    const orderNumber = extractOrderNumber(item);
    if (orderNumber) {
      router.push(`/dashboard/tracking?order=${encodeURIComponent(orderNumber)}`);
    } else if (item.orderId || item.type === "order_status") {
      router.push("/dashboard/orders");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <DashboardCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
                নোটিফিকেশন সেন্টার
              </h2>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 tabular-nums dark:bg-rose-950/60 dark:text-rose-300">
                  {unreadCount} অপঠিত
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              আপনার অর্ডার কনফার্মেশন, প্যাকিং, কুরিয়ার ও ডেলিভারি সংক্রান্ত সকল আপডেট
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-neutral-200/90 bg-neutral-100/70 p-1 dark:border-white/10 dark:bg-[#0e1514]">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  filter === "all"
                    ? "bg-white text-emerald-800 shadow-xs dark:bg-white/10 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                )}
              >
                সকল ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  filter === "unread"
                    ? "bg-white text-emerald-800 shadow-xs dark:bg-white/10 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                )}
              >
                অপঠিত ({unreadCount})
              </button>
            </div>

            <button
              type="button"
              disabled={unreadCount === 0 || markingAll}
              onClick={() => void handleMarkAllRead()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
            >
              <MaterialIcon name="done_all" className="text-[16px]" />
              <span>
                {markingAll
                  ? "আপডেট হচ্ছে..."
                  : "সব পঠিত হিসেবে চিহ্নিত করুন"}
              </span>
            </button>
          </div>
        </div>

        {/* 30-Day Retention Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sky-200/70 bg-sky-50/60 px-3.5 py-2.5 text-[11px] text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
          <MaterialIcon
            name="info"
            className="mt-0.5 shrink-0 text-[16px] text-sky-600 dark:text-sky-400"
          />
          <p className="leading-relaxed">
            সিস্টেমে গত <strong>৩০ দিনের</strong> নোটিফিকেশন সংরক্ষিত থাকে। ৩০ দিনের পুরোনো নোটিফিকেশন স্বয়ংক্রিয়ভাবে মুছে যায়।
          </p>
        </div>
      </DashboardCard>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Notification List */}
      {loading ? (
        <DashboardCard className="py-12 text-center text-xs text-neutral-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3">নোটিফিকেশন লোড হচ্ছে...</p>
        </DashboardCard>
      ) : visibleItems.length === 0 ? (
        <DashboardCard className="py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-white/5">
            <MaterialIcon
              name={filter === "unread" ? "mark_email_read" : "notifications_none"}
              className="text-[28px]"
            />
          </span>
          <h3 className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">
            {filter === "unread"
              ? "কোনো অপঠিত নোটিফিকেশন নেই"
              : "এখনও কোনো নোটিফিকেশন নেই"}
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {filter === "unread"
              ? "আপনি সব নোটিফিকেশন পড়ে ফেলেছেন।"
              : "অর্ডার প্লেস বা স্ট্যাটাস আপডেট হলে এখানে দেখতে পাবেন।"}
          </p>
        </DashboardCard>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const orderNumber = extractOrderNumber(item);
            const isBusy = busyId === item.id;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => void handleCardClick(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void handleCardClick(item);
                  }
                }}
                className={cn(
                  "group cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-sm sm:p-5",
                  item.isRead
                    ? "border-neutral-200/80 bg-white dark:border-white/10 dark:bg-[#131c1b]"
                    : "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-950/20",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl",
                      item.isRead
                        ? "bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                    )}
                  >
                    <MaterialIcon
                      name={
                        item.type === "order_status"
                          ? "local_shipping"
                          : "notifications"
                      }
                      className="text-[20px]"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.isRead ? (
                        <span className="size-2 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      ) : null}
                      <h3
                        className={cn(
                          "text-sm",
                          item.isRead
                            ? "font-semibold text-neutral-800 dark:text-neutral-200"
                            : "font-bold text-neutral-950 dark:text-white",
                        )}
                      >
                        {item.title}
                      </h3>
                      {orderNumber ? (
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-700 dark:bg-white/10 dark:text-neutral-300">
                          #{orderNumber}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {item.message}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        {formatNotificationTime(item.createdAt)} ·{" "}
                        {formatBanglaDate(item.createdAt, true)}
                      </span>

                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!item.isRead ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleMarkOneRead(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800/50 dark:bg-white/5 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                          >
                            <MaterialIcon name="done" className="text-[14px]" />
                            <span>পঠিত</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleDelete(item.id)}
                          aria-label="নোটিফিকেশন মুছুন"
                          title="মুছুন"
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <MaterialIcon
                            name="delete_outline"
                            className="text-[14px]"
                          />
                          <span>মুছুন</span>
                        </button>
                      </div>
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
