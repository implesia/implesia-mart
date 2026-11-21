"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import {
  getCustomerOrders,
  getCustomerOrderTracking,
  type CustomerOrderSummary,
  type OrderTrackingDetail,
} from "@/lib/mart-api/customer";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { formatCartMoney } from "../../_lib/cart-shared";
import {
  DashboardCard,
  DashboardOrderStatusBadge,
  formatBanglaDate,
} from "../_components/dashboard-ui";

const ACTIVE_STATUSES = new Set(["new", "confirmed", "packed", "shipped"]);

const STEP_ICONS: Record<string, string> = {
  new: "receipt_long",
  confirmed: "verified",
  packed: "inventory_2",
  shipped: "local_shipping",
  delivered: "task_alt",
  cancelled: "cancel",
  returned: "assignment_return",
};

function readEventText(event: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = event[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const queryOrder = searchParams.get("order")?.trim() ?? "";

  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>(
    queryOrder,
  );
  const [searchInput, setSearchInput] = useState(queryOrder);

  const [tracking, setTracking] = useState<OrderTrackingDetail | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getCustomerOrders({ page: 1, pageSize: 50 });
        if (cancelled) return;
        setOrders(data.items);
        setSelectedOrderNumber((current) => {
          if (current) return current;
          const active = data.items.find((order) =>
            ACTIVE_STATUSES.has(order.status.toLowerCase()),
          );
          return active?.number ?? data.items[0]?.number ?? "";
        });
      } catch {
        /* Handled gracefully below */
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedOrderNumber) return;
    let cancelled = false;
    void (async () => {
      setTrackingLoading(true);
      setTrackingError(null);
      try {
        const data = await getCustomerOrderTracking(selectedOrderNumber);
        if (!cancelled) setTracking(data);
      } catch (err) {
        if (!cancelled) {
          setTracking(null);
          setTrackingError(
            err instanceof Error
              ? err.message
              : "এই অর্ডারের ট্র্যাকিং তথ্য পাওয়া যায়নি।",
          );
        }
      } finally {
        if (!cancelled) setTrackingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedOrderNumber]);

  const selectedSummary = useMemo(
    () => orders.find((o) => o.number === selectedOrderNumber) ?? null,
    [orders, selectedOrderNumber],
  );

  const isCancelled = tracking?.status.toLowerCase() === "cancelled";
  const isReturned = tracking?.status.toLowerCase() === "returned";
  const isTerminalIssue = isCancelled || isReturned;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = searchInput.trim().toUpperCase().replace(/^#/, "");
    if (!cleaned) return;
    setSelectedOrderNumber(cleaned);
  }

  async function handleCopyTracking(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable */
    }
  }

  return (
    <div className="space-y-5">
      {/* Order Selector & Search Header */}
      <DashboardCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-950 sm:text-xl dark:text-white">
              অর্ডার ট্র্যাকিং
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              যেকোনো অর্ডারের বর্তমান অবস্থান, ধাপভিত্তিক সময় ও কুরিয়ার তথ্য দেখুন
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full items-center gap-2 sm:w-auto"
          >
            <div className="relative flex-1 sm:w-56">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[17px] text-neutral-400"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="অর্ডার নং (যেমন: IM-...)"
                className="h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/70 pr-3 pl-9 font-mono text-xs text-neutral-900 outline-none transition placeholder:font-sans placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#131c1b]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              <MaterialIcon name="my_location" className="text-[16px]" />
              <span>খুঁজুন</span>
            </button>
          </form>
        </div>

        {/* Quick Order Switcher Pills */}
        {orders.length > 0 ? (
          <div className="mt-4 border-t border-neutral-100 pt-3.5 dark:border-white/10">
            <p className="mb-2 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              আপনার সাম্প্রতিক অর্ডারসমূহ থেকে নির্বাচন করুন:
            </p>
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              {orders.slice(0, 12).map((order) => {
                const active = order.number === selectedOrderNumber;
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrderNumber(order.number);
                      setSearchInput(order.number);
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all",
                      active
                        ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-500/30 dark:border-emerald-500/60 dark:bg-emerald-950/50 dark:text-emerald-100"
                        : "border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.07]",
                    )}
                  >
                    <span className="font-mono font-bold">#{order.number}</span>
                    <span className="text-[10px] text-neutral-400">
                      {formatCartMoney(order.total)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </DashboardCard>

      {/* Main Tracking Detail */}
      {ordersLoading && !selectedOrderNumber ? (
        <DashboardCard className="py-12 text-center text-xs text-neutral-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3">অর্ডার তথ্য লোড হচ্ছে...</p>
        </DashboardCard>
      ) : !selectedOrderNumber ? (
        <DashboardCard className="py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-white/5">
            <MaterialIcon name="local_shipping" className="text-[28px]" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-neutral-900 dark:text-white">
            ট্র্যাক করার মতো কোনো অর্ডার নেই
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            আপনি নতুন অর্ডার করলে এখানে তার প্রতিটি ধাপ লাইভ দেখতে পারবেন।
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            <MaterialIcon name="storefront" className="text-[16px]" />
            <span>শপিং শুরু করুন</span>
          </Link>
        </DashboardCard>
      ) : trackingLoading ? (
        <DashboardCard className="py-12 text-center text-xs text-neutral-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3">#{selectedOrderNumber} এর ট্র্যাকিং তথ্য লোড হচ্ছে...</p>
        </DashboardCard>
      ) : trackingError || !tracking ? (
        <DashboardCard className="py-10 text-center">
          <MaterialIcon name="error_outline" className="text-[32px] text-rose-500" />
          <p className="mt-2 text-sm font-bold text-neutral-900 dark:text-white">
            {trackingError || "ট্র্যাকিং তথ্য পাওয়া যায়নি"}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            অর্ডার নম্বরটি সঠিকভাবে যাচাই করে আবার চেষ্টা করুন।
          </p>
        </DashboardCard>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* Left: Progress Timeline Card */}
          <DashboardCard>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4 dark:border-white/10">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-mono text-base font-extrabold text-neutral-950 dark:text-white">
                    #{tracking.orderNumber}
                  </h3>
                  <DashboardOrderStatusBadge status={tracking.status} />
                </div>
                {selectedSummary ? (
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {selectedSummary.firstItemTitle || `${selectedSummary.itemsCount}টি আইটেম`} ·{" "}
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      {formatCartMoney(selectedSummary.total)}
                    </strong>
                  </p>
                ) : null}
              </div>

              <Link
                href={`/dashboard/orders?order=${encodeURIComponent(tracking.orderNumber)}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
              >
                <MaterialIcon name="receipt_long" className="text-[16px] text-neutral-500" />
                <span>রসিদ দেখুন</span>
              </Link>
            </div>

            {/* Distinct Banner for Cancelled / Returned */}
            {isCancelled ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/35 dark:text-rose-200">
                <MaterialIcon name="cancel" className="mt-0.5 text-[20px] text-rose-600 dark:text-rose-400" />
                <div>
                  <p className="font-bold">অর্ডারটি বাতিল করা হয়েছে</p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    কোনো জিজ্ঞাসা থাকলে অর্ডার নম্বরসহ আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            ) : isReturned ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-200">
                <MaterialIcon name="assignment_return" className="mt-0.5 text-[20px] text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-bold">অর্ডারটি রিটার্ন হিসেবে প্রসেস হয়েছে</p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    নিচে অর্ডারটির সম্পন্ন হওয়া সকল ধাপ ও রিটার্নের সময় দেখতে পাচ্ছেন।
                  </p>
                </div>
              </div>
            ) : null}

            {/* Horizontal 5-Step Progress Bar (Desktop, Normal Statuses) */}
            {!isTerminalIssue && tracking.timeline.length > 0 ? (
              <div className="mt-6 hidden md:block">
                <div className="relative grid grid-cols-5 gap-2">
                  {tracking.timeline.map((step, idx) => {
                    const isLast = idx === tracking.timeline.length - 1;
                    const nextCompleted =
                      !isLast && tracking.timeline[idx + 1]?.completed;
                    const iconName = STEP_ICONS[step.status.toLowerCase()] ?? "check";
                    return (
                      <div key={step.status} className="relative flex flex-col items-center text-center">
                        {!isLast ? (
                          <div
                            className={cn(
                              "absolute top-4.5 left-1/2 h-0.5 w-full",
                              nextCompleted
                                ? "bg-emerald-600 dark:bg-emerald-500"
                                : "bg-neutral-200 dark:bg-white/10",
                            )}
                          />
                        ) : null}
                        <span
                          className={cn(
                            "relative z-10 grid size-9 place-items-center rounded-full border-2 transition-colors",
                            step.completed
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-xs dark:border-emerald-500 dark:bg-emerald-500 dark:text-neutral-950"
                              : "border-neutral-200 bg-white text-neutral-400 dark:border-white/15 dark:bg-[#131c1b] dark:text-neutral-500",
                          )}
                        >
                          <MaterialIcon name={iconName} className="text-[18px]" />
                        </span>
                        <p
                          className={cn(
                            "mt-2.5 text-xs font-bold leading-snug",
                            step.completed
                              ? "text-neutral-950 dark:text-white"
                              : "text-neutral-400 dark:text-neutral-500",
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                          {step.timestamp
                            ? formatBanglaDate(step.timestamp)
                            : step.completed
                              ? "সম্পন্ন"
                              : "অপেক্ষমাণ"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Detailed Vertical Timeline (Always shown on mobile & terminal states, and detailed log on desktop) */}
            <div className="mt-6 space-y-0">
              {tracking.timeline.map((step, idx) => {
                const st = step.status.toLowerCase();
                const isLast = idx === tracking.timeline.length - 1;
                const isStepCancelled = st === "cancelled";
                const isStepReturned = st === "returned";
                const iconName = STEP_ICONS[st] ?? "check";

                return (
                  <div key={`${step.status}-${idx}`} className="relative flex gap-3.5 pb-5 last:pb-0">
                    {!isLast ? (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-8 left-4 h-[calc(100%-1.5rem)] w-0.5 -translate-x-1/2",
                          tracking.timeline[idx + 1]?.completed
                            ? isStepCancelled
                              ? "bg-rose-300 dark:bg-rose-800"
                              : isStepReturned
                                ? "bg-amber-300 dark:bg-amber-800"
                                : "bg-emerald-500/70 dark:bg-emerald-600/60"
                            : "bg-neutral-200 dark:bg-white/10",
                        )}
                      />
                    ) : null}

                    <span
                      className={cn(
                        "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border",
                        isStepCancelled
                          ? "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300"
                          : isStepReturned
                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            : step.completed
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-white/10 dark:bg-white/5 dark:text-neutral-500",
                      )}
                    >
                      <MaterialIcon name={iconName} className="text-[17px]" />
                    </span>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs font-bold",
                            isStepCancelled
                              ? "text-rose-700 dark:text-rose-300"
                              : isStepReturned
                                ? "text-amber-800 dark:text-amber-300"
                                : step.completed
                                  ? "text-neutral-950 dark:text-white"
                                  : "text-neutral-400 dark:text-neutral-500",
                          )}
                        >
                          {step.label}
                        </p>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {step.timestamp
                            ? formatBanglaDate(step.timestamp, true)
                            : step.completed
                              ? "সম্পন্ন"
                              : "অপেক্ষমাণ"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardCard>

          {/* Right: Courier Info & Live Courier Events Card */}
          <div className="space-y-5">
            <DashboardCard>
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-[#0b5e56] dark:bg-[#0b5e56]/35 dark:text-[#3dd4c8]">
                  <MaterialIcon name="local_shipping" className="text-[20px]" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                    কুরিয়ার ও পার্সেল তথ্য
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    ডেলিভারি পার্টনার এবং কনসাইনমেন্ট আইডি
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    কুরিয়ার সার্ভিস
                  </p>
                  <p className="mt-1 text-sm font-bold text-neutral-950 dark:text-white">
                    {tracking.courierName || "এখনও নির্ধারিত হয়নি"}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    ট্র্যাকিং নম্বর
                  </p>
                  {tracking.trackingNumber ? (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-sm font-bold text-neutral-950 dark:text-white">
                        {tracking.trackingNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyTracking(tracking.trackingNumber)
                        }
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10"
                      >
                        <MaterialIcon
                          name={copied ? "check" : "content_copy"}
                          className={cn(
                            "text-[14px]",
                            copied && "text-emerald-600",
                          )}
                        />
                        <span>{copied ? "কপি হয়েছে" : "কপি"}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      পার্সেল কুরিয়ারে হস্তান্তর হলে ট্র্যাকিং কোড যুক্ত হবে।
                    </p>
                  )}
                </div>

                {tracking.trackingUrl ? (
                  <a
                    href={tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
                  >
                    <span>কুরিয়ার ওয়েবসাইটে ট্র্যাক করুন</span>
                    <MaterialIcon name="open_in_new" className="text-[15px]" />
                  </a>
                ) : null}
              </div>

              {/* Live Courier API Events / Placeholder */}
              <div className="mt-5 border-t border-neutral-100 pt-4 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    লাইভ কুরিয়ার আপডেট
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#0b5e56] ring-1 ring-inset ring-[#2bc0b5]/30 dark:bg-[#0b5e56]/40 dark:text-[#3dd4c8]">
                    <span className="size-1.5 rounded-full bg-[#2bc0b5]" />
                    <span>
                      {tracking.liveEvents.length > 0
                        ? "লাইভ যুক্ত"
                        : "শীঘ্রই আসছে"}
                    </span>
                  </span>
                </div>

                {tracking.liveEvents.length > 0 ? (
                  <div className="mt-3 space-y-2.5">
                    {tracking.liveEvents.map((event, idx) => {
                      const title =
                        readEventText(event, [
                          "status",
                          "title",
                          "event",
                          "label",
                        ]) || "কুরিয়ার আপডেট";
                      const message = readEventText(event, [
                        "message",
                        "description",
                        "location",
                        "hub",
                      ]);
                      const timeRaw = readEventText(event, [
                        "timestamp",
                        "at",
                        "created_at",
                        "time",
                      ]);
                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 text-xs dark:border-white/10 dark:bg-white/[0.03]"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="font-bold text-neutral-900 dark:text-white">
                              {title}
                            </p>
                            {timeRaw ? (
                              <span className="text-[10px] text-neutral-400">
                                {formatBanglaDate(timeRaw, true)}
                              </span>
                            ) : null}
                          </div>
                          {message ? (
                            <p className="mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                              {message}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-4 text-center dark:border-white/10 dark:bg-white/[0.02]">
                    <MaterialIcon
                      name="route"
                      className="text-[24px] text-[#0b5e56] dark:text-[#3dd4c8]"
                    />
                    <p className="mt-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      লাইভ কুরিয়ার ট্র্যাকিং শীঘ্রই যুক্ত হবে
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Steadfast ও Pathao লাইভ এপিআই যুক্ত হলে প্রতিটি হাবের রিয়েল-টাইম আপডেট এখানে দেখাবে।
                    </p>
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardTrackingPage() {
  return (
    <Suspense
      fallback={
        <DashboardCard className="py-12 text-center text-xs text-neutral-500">
          ট্র্যাকিং লোড হচ্ছে...
        </DashboardCard>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
