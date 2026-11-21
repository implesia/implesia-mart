"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
  type CustomerNotificationItem,
} from "@/lib/mart-api/customer";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "./material-icon";

export const CUSTOMER_NOTIFICATIONS_CHANGED =
  "implesia:customer-notifications-changed";

export function notifyCustomerNotificationsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CUSTOMER_NOTIFICATIONS_CHANGED));
}

export function formatNotificationTime(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "এইমাত্র";
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays} দিন আগে`;
    return date.toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function useCustomerUnreadCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    const load = () => {
      void getCustomerNotifications(1)
        .then((res) => {
          if (alive) setCount(res.unreadCount);
        })
        .catch(() => undefined);
    };

    load();
    const timer = window.setInterval(load, 60_000);
    window.addEventListener("focus", load);
    window.addEventListener(CUSTOMER_NOTIFICATIONS_CHANGED, load);

    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener(CUSTOMER_NOTIFICATIONS_CHANGED, load);
    };
  }, [enabled]);

  return enabled ? count : 0;
}

export function CustomerNotificationBell({
  enabled,
  className,
}: {
  enabled: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const [items, setItems] = useState<CustomerNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpenPath(null), []);

  const refresh = useCallback(async (showSpinner = false) => {
    if (!enabled) return;
    if (showSpinner) setLoading(true);
    try {
      const data = await getCustomerNotifications(5);
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      /* Ignore transient errors on bell refresh */
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const sync = () => {
      void getCustomerNotifications(5)
        .then((data) => {
          if (!alive) return;
          setItems(data.items);
          setUnreadCount(data.unreadCount);
        })
        .catch(() => undefined);
    };
    sync();
    const timer = window.setInterval(sync, 60_000);
    window.addEventListener("focus", sync);
    window.addEventListener(CUSTOMER_NOTIFICATIONS_CHANGED, sync);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener(CUSTOMER_NOTIFICATIONS_CHANGED, sync);
    };
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  if (!enabled) return null;

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  async function handleItemClick(item: CustomerNotificationItem) {
    close();
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markCustomerNotificationRead(item.id);
        notifyCustomerNotificationsChanged();
      } catch {
        void refresh();
      }
    }
    router.push("/dashboard/notifications");
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllCustomerNotificationsRead();
      setItems((prev) => prev.map((row) => ({ ...row, isRead: true })));
      setUnreadCount(0);
      notifyCustomerNotificationsChanged();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpenPath(nextOpen ? pathname : null);
          if (nextOpen) {
            void refresh(items.length === 0);
          }
        }}
        className={cn(
          "relative inline-flex size-9 items-center justify-center rounded-full border border-transparent text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white",
          open && "border-neutral-200 bg-neutral-100 text-neutral-950 dark:border-white/15 dark:bg-white/10 dark:text-white",
        )}
        aria-label={
          unreadCount > 0
            ? `নোটিফিকেশন (${unreadCount}টি অপঠিত)`
            : "নোটিফিকেশন"
        }
        aria-expanded={open}
        aria-haspopup="menu"
        title="নোটিফিকেশন"
      >
        <MaterialIcon
          name={unreadCount > 0 ? "notifications_active" : "notifications"}
          className="text-[21px]"
        />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white tabular-nums dark:ring-[#121a19]">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(92vw,22rem)] origin-top-right overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-neutral-900 shadow-2xl shadow-black/10 ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 dark:border-white/10 dark:bg-[#131c1b] dark:text-neutral-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-950 dark:text-white">
                নোটিফিকেশন
              </span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 tabular-nums dark:bg-rose-950/60 dark:text-rose-300">
                  {unreadCount} নতুন
                </span>
              ) : null}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={markingAll}
                onClick={() => void handleMarkAllRead()}
                className="text-[11px] font-semibold text-emerald-700 transition-colors hover:text-emerald-800 hover:underline disabled:opacity-50 dark:text-emerald-400"
              >
                সব পড়া হয়েছে
              </button>
            ) : null}
          </div>

          {/* Preview list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-white/5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-white/5">
                  <MaterialIcon name="notifications_none" className="text-[22px]" />
                </span>
                <p className="mt-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  কোনো নোটিফিকেশন নেই
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  অর্ডার আপডেট এলে এখানে দেখতে পাবেন।
                </p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => void handleItemClick(item)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-white/5",
                    !item.isRead && "bg-emerald-50/40 dark:bg-emerald-950/20",
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
                      <p
                        className={cn(
                          "truncate text-xs",
                          item.isRead
                            ? "font-medium text-neutral-700 dark:text-neutral-300"
                            : "font-bold text-neutral-950 dark:text-white",
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500">
                        {formatNotificationTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {item.message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-100 bg-neutral-50/70 p-2 dark:border-white/10 dark:bg-white/[0.03]">
            <Link
              href="/dashboard/notifications"
              onClick={close}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              <span>সব নোটিফিকেশন দেখুন</span>
              <MaterialIcon name="arrow_forward" className="text-[15px]" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
