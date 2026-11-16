"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import { formatRatePercent, sumStatusCounts } from "@/lib/admin/orders-desk";
import { getOrderOverview, type OrderOverview } from "@/lib/mart-api/orders-desk";
import { MartApiError } from "@/lib/mart-api/products";
import { ORDER_STATUSES, formatTaka } from "@/lib/mart-mock/store";

import { ADMIN_ORDER_STATUS_LABEL, AdminEmpty, AdminPageHeader } from "../../_components/admin-ui";
import { OriginBadge } from "./order-badges";

export function OrdersOverview() {
  const [data, setData] = useState<OrderOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOrderOverview()
      .then((next) => {
        if (!cancelled) {
          setData(next);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof MartApiError ? reason.message : "Could not load the orders overview.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Orders overview"
        description="Today, this week, and this month use Asia/Dhaka. Revenue leaves out cancelled and returned orders. Counts include every status."
        action={
          <Link href="/admin/orders/new" className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800">
            Create order
          </Link>
        }
      />
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      {!data && !error ? <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" /> : null}
      {data ? (
        <>
          <section aria-label="Order periods" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Kpi label="Today" value={String(data.today.orders)} hint={formatTaka(data.today.revenue)} />
            <Kpi label="This week" value={String(data.week.orders)} hint={formatTaka(data.week.revenue)} />
            <Kpi label="This month" value={String(data.month.orders)} hint={formatTaka(data.month.revenue)} />
            <Kpi label="Pending confirm" value={String(data.pendingConfirm)} hint="Status: new" href="/admin/orders/list?status=new" />
            <Kpi label="Ready to pack" value={String(data.readyToPack)} hint="Status: confirmed" href="/admin/orders/ready-to-pack" />
            <Kpi label="Shipped" value={String(data.shipped)} hint="Out for delivery" href="/admin/orders/list?status=shipped" />
            <Kpi label="Return rate" value={formatRatePercent(data.returnRatePercent)} hint="Returned ÷ delivered + returned" />
            <Kpi label="Cancel rate" value={formatRatePercent(data.cancelRatePercent)} hint="Cancelled ÷ every order" />
            {data.origins.map((origin) => (
              <Kpi
                key={origin.origin}
                label={origin.origin === "online" ? "Online" : "Offline"}
                value={String(origin.orders)}
                hint={formatTaka(origin.revenue)}
                href={`/admin/orders/list?origin=${origin.origin}`}
              />
            ))}
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <h2 className="text-sm font-semibold text-neutral-950">Status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/admin/orders/list" className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800">
                All {sumStatusCounts(data.statusCounts)}
              </Link>
              {ORDER_STATUSES.map((status) => (
                <Link
                  key={status}
                  href={`/admin/orders/list?status=${status}`}
                  className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800"
                >
                  {ADMIN_ORDER_STATUS_LABEL[status]} {data.statusCounts[status]}
                </Link>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
            <div className="flex items-center justify-between px-4 py-4 sm:px-5">
              <h2 className="text-sm font-semibold text-neutral-950">Recent orders</h2>
              <Link href="/admin/orders/list" className="text-sm font-medium text-primary">View list</Link>
            </div>
            {data.recent.length === 0 ? (
              <AdminEmpty title="No orders yet" detail="A checkout or a counter order will show up here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="text-xs text-neutral-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Order</th>
                      <th className="px-4 py-2 font-medium">Customer</th>
                      <th className="px-4 py-2 font-medium">Source</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((order) => (
                      <tr key={order.id} className="border-t border-neutral-100">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="font-semibold text-neutral-950 hover:text-primary">
                            {order.number}
                          </Link>
                          <span className="block text-xs text-neutral-500">{formatDhakaDateTime(order.orderedAt ?? order.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block">{order.customerName}</span>
                          <span className="block text-xs text-neutral-500">{order.phone}</span>
                        </td>
                        <td className="px-4 py-3"><OriginBadge origin={order.origin} /></td>
                        <td className="px-4 py-3">{ADMIN_ORDER_STATUS_LABEL[order.status] ?? order.status}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatTaka(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ label, value, hint, href }: { label: string; value: string; hint: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </>
  );
  const className = "rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90";
  if (!href) return <div className={className}>{body}</div>;
  return <Link href={href} className={`${className} block hover:ring-primary`}>{body}</Link>;
}
