"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import { formatTaka } from "@/lib/mart-mock/store";
import { listCouponRedemptions, setCouponActive } from "@/lib/mart-api/coupons";
import type { CouponRedemption } from "@/lib/admin/coupons";
import { MartApiError } from "@/lib/mart-api/products";

import { InventoryPager } from "../../inventory/_components/pager";
import { adminButtonClass } from "../../_components/admin-ui";
import { useInventoryWriter } from "../../inventory/_components/use-inventory-role";
import { CouponForm } from "../_components/coupon-form";

export default function EditCouponPage() {
  const params = useParams<{ id: string }>();
  const couponId = decodeURIComponent(params.id ?? "");
  const canWrite = useInventoryWriter();
  const [page, setPage] = useState<{ items: CouponRedemption[]; total: number; page: number; pages: number; pageSize: number } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void listCouponRedemptions(couponId, pageNumber, 20)
      .then((result) => {
        if (!cancelled) setPage(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof MartApiError ? reason.message : "Could not load redemptions.");
      });
    return () => {
      cancelled = true;
    };
  }, [couponId, pageNumber]);

  async function flip(active: boolean) {
    setNotice("");
    setError("");
    try {
      const saved = await setCouponActive(couponId, active);
      setNotice(saved.isActive ? "Coupon activated." : "Coupon deactivated.");
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update this coupon.");
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">Edit coupon</h1>
          <p className="mt-1 text-sm text-neutral-600">Change the rule, or turn the code on and off.</p>
        </div>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={adminButtonClass.secondary} onClick={() => void flip(true)}>
              Activate
            </button>
            <button type="button" className={adminButtonClass.secondary} onClick={() => void flip(false)}>
              Deactivate
            </button>
          </div>
        ) : null}
      </header>
      {notice ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}
      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <CouponForm couponId={couponId} />
      <section id="redemptions" className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-neutral-950">Redemption history</h2>
          <p className="mt-1 text-xs text-neutral-500">Orders that used this code. Times are Asia/Dhaka.</p>
        </div>
        {page == null && !error ? (
          <div className="h-24 animate-pulse bg-neutral-50" aria-busy="true" />
        ) : page && page.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">No orders have used this coupon yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium sm:px-5">Order</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">Discount</th>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(page?.items ?? []).map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 sm:px-5">
                      <Link href={`/admin/orders/${row.orderId}`} className="font-medium text-primary">
                        {row.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{row.phone || "—"}</td>
                    <td className="px-4 py-3">{formatTaka(row.discountAmount)}</td>
                    <td className="px-4 py-3">{row.createdAt ? formatDhakaDateTime(row.createdAt) : "—"}</td>
                    <td className="px-4 py-3 capitalize">{row.status || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {page ? (
          <InventoryPager
            page={page.page}
            pages={page.pages}
            total={page.total}
            pageSize={page.pageSize}
            onPage={setPageNumber}
          />
        ) : null}
      </section>
    </div>
  );
}
