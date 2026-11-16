"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

const TONE: Record<CouponStatus, string> = {
  active: "bg-emerald-50 text-emerald-800",
  inactive: "bg-neutral-100 text-neutral-700",
  expired: "bg-red-50 text-red-700",
  scheduled: "bg-amber-50 text-amber-900",
};

export function CouponsList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canWrite = useInventoryWriter();
  const q = params.get("q") ?? "";
  const status = isCouponStatus(params.get("status")) ? (params.get("status") as CouponStatus) : null;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [state, setState] = useState<{ key: string; items: Coupon[]; total: number; pages: number; error: string }>({
    key: "",
    items: [],
    total: 0,
    pages: 1,
    error: "",
  });
  const [busyId, setBusyId] = useState<string | null>(null);
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

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Coupons"
        description="Codes customers type at checkout. The server decides the discount."
        action={
          canWrite ? (
            <Link href="/admin/coupons/new" className={adminButtonClass.primary}>
              New coupon
            </Link>
          ) : (
            <p className="text-sm text-neutral-600">View only. An editor can create coupons.</p>
          )
        }
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search by code</span>
          <input
            value={q}
            onChange={(event) => replace({ q: event.target.value || null, page: null })}
            placeholder="Search by code"
            className={adminFieldClass}
          />
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Status</span>
          <select
            value={status ?? ""}
            onChange={(event) => replace({ status: event.target.value || null, page: null })}
            className={adminFieldClass}
          >
            <option value="">All statuses</option>
            {(Object.keys(COUPON_STATUS_LABEL) as CouponStatus[]).map((item) => (
              <option key={item} value={item}>
                {COUPON_STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" />
      ) : items.length === 0 ? (
        <AdminEmpty title="No coupons" detail="No codes match this search." />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
          <ul className="divide-y divide-neutral-100">
            {items.map((coupon) => (
              <li key={coupon.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/coupons/${coupon.id}`} className="font-mono text-sm font-semibold text-neutral-950 hover:text-primary">
                      {coupon.code}
                    </Link>
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", TONE[coupon.status])}>
                      {COUPON_STATUS_LABEL[coupon.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-700">
                    {formatCouponValue(coupon)}
                    {coupon.freeDelivery ? " · free delivery" : ""}
                    {coupon.maxDiscount != null ? ` · max ৳${coupon.maxDiscount.toLocaleString("en-US")}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Used {formatCouponLimit(coupon)}
                    <span className="text-neutral-300"> · </span>
                    {coupon.startsAt ? formatDhakaDateTime(coupon.startsAt) : "Starts now"}
                    {" – "}
                    {coupon.endsAt ? formatDhakaDateTime(coupon.endsAt) : "no end"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/coupons/${coupon.id}#redemptions`} className={adminButtonClass.secondary}>
                    History
                  </Link>
                  {canWrite ? (
                    <button
                      type="button"
                      disabled={busyId === coupon.id}
                      onClick={() => void toggle(coupon)}
                      className={adminButtonClass.secondary}
                    >
                      {coupon.isActive ? "Deactivate" : "Activate"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <InventoryPager
            page={page}
            pages={state.pages}
            total={state.total}
            pageSize={PAGE_SIZE}
            onPage={(next) => replace({ page: next <= 1 ? null : String(next) })}
          />
        </div>
      )}
    </div>
  );
}
