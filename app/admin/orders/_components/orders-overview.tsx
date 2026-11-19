"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Package, 
  ShoppingBag, 
  Truck, 
  TrendingUp, 
  RotateCcw, 
  XCircle,
  Globe,
  Store
} from "lucide-react";

import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import { formatRatePercent, sumStatusCounts } from "@/lib/admin/orders-desk";
import { getOrderOverview, type OrderOverview } from "@/lib/mart-api/orders-desk";
import { MartApiError } from "@/lib/mart-api/products";
import { ORDER_STATUSES, formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

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
          setData(next as OrderOverview);
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
    <div className="min-w-0 space-y-4 pb-10">
      <AdminPageHeader
        title="Orders Overview"
        description="Today, this week, and this month use Asia/Dhaka. Revenue leaves out cancelled and returned orders. Counts include every status."
        action={
          <Link href="/admin/orders/new" className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            Create Order
          </Link>
        }
      />
      
      {error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {!data && !error ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy="true">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : null}

      {data ? (
        <>
          {/* KPI Grid */}
          <section aria-label="Order metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Kpi label="Today's Orders" value={String(data.today.orders)} hint={formatTaka(data.today.revenue)} icon={Clock} tone="indigo" />
            <Kpi label="This Week" value={String(data.week.orders)} hint={formatTaka(data.week.revenue)} icon={ShoppingBag} tone="violet" />
            <Kpi label="This Month" value={String(data.month.orders)} hint={formatTaka(data.month.revenue)} icon={TrendingUp} tone="emerald" />
            
            <Kpi label="Pending Confirm" value={String(data.pendingConfirm)} hint="Needs review" href="/admin/orders/list?status=new" icon={Clock} tone="amber" />
            <Kpi label="Ready to Pack" value={String(data.readyToPack)} hint="Awaiting packing" href="/admin/orders/ready-to-pack" icon={Package} tone="sky" />
            <Kpi label="Shipped" value={String(data.shipped)} hint="Out for delivery" href="/admin/orders/list?status=shipped" icon={Truck} tone="blue" />
            
            <Kpi label="Return Rate" value={formatRatePercent(data.returnRatePercent)} hint="Returned vs Delivered" icon={RotateCcw} tone="rose" />
            <Kpi label="Cancel Rate" value={formatRatePercent(data.cancelRatePercent)} hint="Cancelled vs Total" icon={XCircle} tone="slate" />
            
            {data.origins.map((origin) => (
              <Kpi
                key={origin.origin}
                label={origin.origin === "online" ? "Online Orders" : "Offline Orders"}
                value={String(origin.orders)}
                hint={formatTaka(origin.revenue)}
                href={`/admin/orders/list?origin=${origin.origin}`}
                icon={origin.origin === "online" ? Globe : Store}
                tone={origin.origin === "online" ? "indigo" : "amber"}
              />
            ))}
          </section>

          {/* Status Filter Pills */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Filter by Status</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/orders/list" className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                All Orders
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                  {sumStatusCounts(data.statusCounts)}
                </span>
              </Link>
              {ORDER_STATUSES.map((status) => (
                <Link
                  key={status}
                  href={`/admin/orders/list?status=${status}`}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {ADMIN_ORDER_STATUS_LABEL[status]}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                    {data.statusCounts[status]}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Orders Table */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
              <Link href="/admin/orders/list" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800">
                View Full List
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            {data.recent.length === 0 ? (
              <AdminEmpty title="No orders yet" detail="A checkout or a counter order will show up here." />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Order</th>
                      <th className="px-4 py-2.5 font-semibold">Customer</th>
                      <th className="px-4 py-2.5 font-semibold">Source</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recent.map((order) => (
                      <tr key={order.id} className="group transition-colors hover:bg-slate-50/80">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                            {order.number}
                          </Link>
                          <span className="mt-0.5 block text-[11px] font-medium text-slate-500">{formatDhakaDateTime(order.orderedAt ?? order.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block text-sm font-medium text-slate-800">{order.customerName}</span>
                          <span className="block text-[11px] font-medium text-slate-500">{order.phone}</span>
                        </td>
                        <td className="px-4 py-3"><OriginBadge origin={order.origin} /></td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-600">
                          {ADMIN_ORDER_STATUS_LABEL[order.status] ?? order.status}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">
                          {formatTaka(order.total)}
                        </td>
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

// Professional KPI Card Component
function Kpi({ 
  label, 
  value, 
  hint, 
  href, 
  icon: Icon, 
  tone 
}: { 
  label: string; 
  value: string; 
  hint: string; 
  href?: string; 
  icon: React.ComponentType<{ className?: string }>; 
  tone: "indigo" | "violet" | "emerald" | "amber" | "sky" | "blue" | "rose" | "slate";
}) {
  const toneStyles = {
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  const content = (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", toneStyles[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3">
        <p className="text-xl font-semibold tabular-nums text-slate-900">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{hint}</p>
      </div>
    </div>
  );

  const baseClass = "rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] h-full";
  
  if (!href) return <div className={baseClass}>{content}</div>;
  
  return (
    <Link href={href} className={cn(baseClass, "group block transition-all hover:border-indigo-200 hover:shadow-md")}>
      {content}
    </Link>
  );
}