"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { InventoryPager } from "@/app/admin/inventory/_components/pager";
import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import {
  COUPON_STATUS_LABEL,
  formatCouponLimit,
  formatCouponValue,
  isCouponStatus,
  type Coupon,
  type CouponStatus,
} from "@/lib/admin/coupons";
import { listCoupons, setCouponActive } from "@/lib/mart-api/coupons";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import {
  adminButtonClass,
  adminFieldClass,
  AdminEmpty,
  AdminPageHeader,
} from "../../_components/admin-ui";
import { useInventoryWriter } from "../../inventory/_components/use-inventory-role";

const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<
  CouponStatus,
  { label: string; badge: string; dot: string; bg: string }
> = {
  active: {
    label: "Active",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
    bg: "hover:bg-emerald-50/40",
  },
  inactive: {
    label: "Inactive",
    badge: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
    dot: "bg-neutral-400",
    bg: "hover:bg-neutral-50/50",
  },
  expired: {
    label: "Expired",
    badge: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dot: "bg-rose-500",
    bg: "hover:bg-rose-50/30",
  },
  scheduled: {
    label: "Scheduled",
    badge: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
    bg: "hover:bg-amber-50/30",
  },
};

export function CouponsList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canWrite = useInventoryWriter();
  const q = params.get("q") ?? "";
  const status = isCouponStatus(params.get("status")) ? (params.get("status") as CouponStatus) : null;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [state, setState] = useState<{
    key: string;
    items: Coupon[];
    total: number;
    pages: number;
    error: string;
  }>({
    key: "",
    items: [],
    total: 0,
    pages: 1,
    error: "",
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const key = `${q}|${status ?? ""}|${page}`;

  function replace(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [name, value] of Object.entries(patch)) {
      if (!value) next.delete(name);
      else next.set(name, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleCopy(code: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode((curr) => (curr === code ? null : curr)), 2000);
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    void listCoupons({ q, status, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setState({ key, items: result.items, total: result.total, pages: result.pages, error: "" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          key,
          items: [],
          total: 0,
          pages: 1,
          error: error instanceof MartApiError ? error.message : "Could not load coupons.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [key, page, q, status]);

  async function toggle(coupon: Coupon) {
    if (!canWrite) return;
    setBusyId(coupon.id);
    try {
      await setCouponActive(coupon.id, !coupon.isActive);
      const result = await listCoupons({ q, status, page, pageSize: PAGE_SIZE });
      setState({ key, items: result.items, total: result.total, pages: result.pages, error: "" });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof MartApiError ? error.message : "Could not update this coupon.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  const loading = state.key !== key;
  const items = state.key === key ? state.items : [];

  // Summary Metrics
  const activeCount = items.filter((c) => c.status === "active").length;
  const totalUses = items.reduce((acc, c) => acc + (c.usedCount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <AdminPageHeader
        title="Coupons & Discounts"
        description="Manage promotional codes, discount limits, and checkout voucher rules."
        action={
          canWrite ? (
            <Link
              href="/admin/coupons/new"
              className={cn(
                adminButtonClass.primary,
                "gap-2 bg-primary hover:bg-primary/90 text-white shadow-xs"
              )}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              <span>New coupon</span>
            </Link>
          ) : (
            <p className="text-xs sm:text-sm text-neutral-500">
              View only. An editor can create coupons.
            </p>
          )
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs sm:p-4 dark:border-white/10 dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MaterialIcon name="confirmation_number" className="text-[18px]" />
            </span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Codes</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
              {state.total}
            </span>
            <span className="text-xs text-neutral-400">coupons</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs sm:p-4 dark:border-white/10 dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <MaterialIcon name="check_circle" className="text-[18px]" />
            </span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Active Now</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-emerald-600 sm:text-2xl">
              {loading ? "—" : activeCount}
            </span>
            <span className="text-xs text-neutral-400">on this page</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs sm:p-4 dark:border-white/10 dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
              <MaterialIcon name="redeem" className="text-[18px]" />
            </span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Uses</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
              {loading ? "—" : totalUses.toLocaleString("en-US")}
            </span>
            <span className="text-xs text-neutral-400">redemptions</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs sm:p-4 dark:border-white/10 dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <MaterialIcon name="tune" className="text-[18px]" />
            </span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Page Info</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
              {page} / {state.pages || 1}
            </span>
            <span className="text-xs text-neutral-400">pages</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-xs dark:border-white/10 dark:bg-neutral-900">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative min-w-0 flex-1">
            <MaterialIcon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-neutral-400"
            />
            <input
              value={q}
              onChange={(event) => replace({ q: event.target.value || null, page: null })}
              placeholder="Search by coupon code (e.g. SUMMER20)..."
              className={cn(
                adminFieldClass,
                "pl-9 pr-8 text-sm focus:border-primary focus:ring-primary/20"
              )}
            />
            {q ? (
              <button
                type="button"
                onClick={() => replace({ q: null, page: null })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                aria-label="Clear search"
              >
                <MaterialIcon name="close" className="text-[16px]" />
              </button>
            ) : null}
          </div>

          {/* Status Quick Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => replace({ status: null, page: null })}
              className={cn(
                "cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                status === null
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70 dark:bg-neutral-800 dark:text-neutral-300"
              )}
            >
              All
            </button>
            {(Object.keys(COUPON_STATUS_LABEL) as CouponStatus[]).map((item) => {
              const active = status === item;
              const cfg = STATUS_CONFIG[item];
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => replace({ status: item, page: null })}
                  className={cn(
                    "cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70 dark:bg-neutral-800 dark:text-neutral-300"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", active ? "bg-white dark:bg-neutral-900" : cfg.dot)} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {state.error ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <MaterialIcon name="error_outline" className="text-[18px] shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {/* Content Area */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-neutral-900">
          <div className="space-y-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-center justify-between border-b border-neutral-100 pb-3.5 last:border-0 last:pb-0">
                <div className="space-y-2">
                  <div className="h-5 w-32 rounded-md bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-3.5 w-48 rounded-md bg-neutral-100 dark:bg-neutral-800/60" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 rounded-md bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-8 w-20 rounded-md bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-neutral-900">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name="sell" className="text-[24px]" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">No coupons found</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {q || status
              ? "No voucher codes match your current search and filter criteria."
              : "You haven't created any coupon codes yet."}
          </p>
          {canWrite ? (
            <Link
              href="/admin/coupons/new"
              className={cn(adminButtonClass.primary, "mt-4 gap-2 bg-primary hover:bg-primary/90 text-white")}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              <span>Create first coupon</span>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-neutral-900">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200/80 bg-neutral-50/70 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-white/10 dark:bg-neutral-800/50 dark:text-neutral-400">
                <tr>
                  <th className="px-5 py-3.5">Code & Type</th>
                  <th className="px-4 py-3.5">Discount Details</th>
                  <th className="px-4 py-3.5">Usage / Limits</th>
                  <th className="px-4 py-3.5">Schedule</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {items.map((coupon) => {
                  const cfg = STATUS_CONFIG[coupon.status];
                  const hasUsageLimit = coupon.usageLimitTotal != null && coupon.usageLimitTotal > 0;
                  const usagePercent = hasUsageLimit
                    ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimitTotal!) * 100))
                    : null;

                  return (
                    <tr
                      key={coupon.id}
                      className={cn(
                        "transition-colors duration-150 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40",
                        coupon.status === "inactive" && "opacity-80"
                      )}
                    >
                      {/* Code & Type */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/coupons/${coupon.id}`}
                            className="font-mono text-sm font-bold text-neutral-950 hover:text-primary dark:text-white"
                          >
                            {coupon.code}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            title="Copy code"
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                          >
                            <MaterialIcon
                              name={copiedCode === coupon.code ? "check" : "content_copy"}
                              className={cn(
                                "text-[16px]",
                                copiedCode === coupon.code && "text-emerald-600 font-bold"
                              )}
                            />
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {formatCouponValue(coupon)}
                          </span>
                          {coupon.freeDelivery ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <MaterialIcon name="local_shipping" className="text-[12px]" />
                              Free Ship
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Discount Details */}
                      <td className="px-4 py-4 align-top text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                        {coupon.minOrderAmount > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-400 font-medium">Min Order:</span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              ৳{coupon.minOrderAmount.toLocaleString("en-US")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">No minimum order</span>
                        )}
                        {coupon.maxDiscount != null ? (
                          <div className="mt-0.5 flex items-center gap-1">
                            <span className="text-neutral-400 font-medium">Max Cap:</span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              ৳{coupon.maxDiscount.toLocaleString("en-US")}
                            </span>
                          </div>
                        ) : null}
                        {coupon.firstOrderOnly ? (
                          <span className="mt-1 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                            1st order only
                          </span>
                        ) : null}
                      </td>

                      {/* Usage & Limits */}
                      <td className="px-4 py-4 align-top">
                        <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {formatCouponLimit(coupon)} uses
                        </div>
                        {hasUsageLimit ? (
                          <div className="mt-1.5 w-24 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <div
                              className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                usagePercent! >= 90
                                  ? "bg-rose-500"
                                  : usagePercent! >= 70
                                  ? "bg-amber-500"
                                  : "bg-primary"
                              )}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        ) : (
                          <span className="mt-0.5 block text-[11px] text-neutral-400">Unlimited quota</span>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="px-4 py-4 align-top text-xs text-neutral-500 dark:text-neutral-400">
                        <div>
                          <span className="text-neutral-400">From: </span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {coupon.startsAt ? formatDhakaDateTime(coupon.startsAt) : "Immediate"}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          <span className="text-neutral-400">To: </span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {coupon.endsAt ? formatDhakaDateTime(coupon.endsAt) : "No expiry"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-top text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            cfg.badge
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/coupons/${coupon.id}#redemptions`}
                            className={cn(adminButtonClass.secondary, "h-8 px-2.5 text-xs")}
                            title="View redemptions"
                          >
                            <MaterialIcon name="history" className="text-[16px]" />
                            <span>History</span>
                          </Link>
                          {canWrite ? (
                            <button
                              type="button"
                              disabled={busyId === coupon.id}
                              onClick={() => void toggle(coupon)}
                              className={cn(
                                adminButtonClass.secondary,
                                "h-8 px-2.5 text-xs transition-colors",
                                coupon.isActive
                                  ? "text-neutral-700 hover:text-red-700"
                                  : "text-emerald-700 hover:bg-emerald-50"
                              )}
                            >
                              {busyId === coupon.id ? (
                                <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                              ) : coupon.isActive ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </button>
                          ) : null}
                          <Link
                            href={`/admin/coupons/${coupon.id}`}
                            className={cn(
                              adminButtonClass.secondary,
                              "h-8 px-2.5 text-xs text-neutral-500 hover:text-neutral-900"
                            )}
                            title="Edit settings"
                          >
                            <MaterialIcon name="edit" className="text-[16px]" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="divide-y divide-neutral-100 lg:hidden dark:divide-white/5">
            {items.map((coupon) => {
              const cfg = STATUS_CONFIG[coupon.status];
              const hasUsageLimit = coupon.usageLimitTotal != null && coupon.usageLimitTotal > 0;
              const usagePercent = hasUsageLimit
                ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimitTotal!) * 100))
                : null;

              return (
                <div key={coupon.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/coupons/${coupon.id}`}
                          className="font-mono text-base font-bold text-neutral-950 hover:text-primary dark:text-white"
                        >
                          {coupon.code}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopy(coupon.code)}
                          title="Copy code"
                          className="text-neutral-400 hover:text-neutral-700"
                        >
                          <MaterialIcon
                            name={copiedCode === coupon.code ? "check" : "content_copy"}
                            className={cn(
                              "text-[16px]",
                              copiedCode === coupon.code && "text-emerald-600 font-bold"
                            )}
                          />
                        </button>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {formatCouponValue(coupon)}
                        </span>
                        {coupon.freeDelivery ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <MaterialIcon name="local_shipping" className="text-[12px]" />
                            Free Delivery
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0",
                        cfg.badge
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400 rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/40">
                    <div>
                      <span className="text-neutral-400 block">Min Order / Cap</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {coupon.minOrderAmount > 0 ? `৳${coupon.minOrderAmount.toLocaleString("en-US")}` : "No min"}
                        {coupon.maxDiscount != null ? ` · Max ৳${coupon.maxDiscount.toLocaleString("en-US")}` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Used Count</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {formatCouponLimit(coupon)}
                      </span>
                    </div>
                  </div>

                  {hasUsageLimit ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-neutral-400">
                        <span>Usage limit</span>
                        <span>{usagePercent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-white/5">
                    <span className="text-[11px] text-neutral-400 truncate">
                      {coupon.startsAt ? formatDhakaDateTime(coupon.startsAt).split(" ")[0] : "Now"} –{" "}
                      {coupon.endsAt ? formatDhakaDateTime(coupon.endsAt).split(" ")[0] : "No end"}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/admin/coupons/${coupon.id}#redemptions`}
                        className={cn(adminButtonClass.secondary, "h-7 px-2 text-xs")}
                      >
                        History
                      </Link>
                      {canWrite ? (
                        <button
                          type="button"
                          disabled={busyId === coupon.id}
                          onClick={() => void toggle(coupon)}
                          className={cn(
                            adminButtonClass.secondary,
                            "h-7 px-2 text-xs",
                            coupon.isActive ? "text-neutral-700" : "text-emerald-700"
                          )}
                        >
                          {busyId === coupon.id ? "..." : coupon.isActive ? "Deactivate" : "Activate"}
                        </button>
                      ) : null}
                      <Link
                        href={`/admin/coupons/${coupon.id}`}
                        className={cn(adminButtonClass.secondary, "h-7 px-2 text-xs")}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pager */}
          <div className="border-t border-neutral-200/80 bg-neutral-50/50 p-2 dark:border-white/10 dark:bg-neutral-800/30">
            <InventoryPager
              page={page}
              pages={state.pages}
              total={state.total}
              pageSize={PAGE_SIZE}
              onPage={(next) => replace({ page: next <= 1 ? null : String(next) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
