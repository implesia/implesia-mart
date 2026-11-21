"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

import {
  CALL_STATUSES,
  CALL_STATUS_LABEL,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  dateSpanError,
  isCallStatus,
  isOrderOrigin,
  isOrderStatus,
  isPaymentMethod,
  isPaymentStatus,
  nextOrderStatuses,
  type CallStatus,
} from "@/lib/admin/orders-desk";
import { formatDhakaDateTime } from "@/lib/admin/order-timestamps";
import { bulkOrderStatus, listDeskOrders, patchDeskOrder } from "@/lib/mart-api/orders-desk";
import type { MartOrder, OrderDirectory } from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";
import { ORDER_STATUSES, formatTaka, type OrderStatus } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_ORDER_STATUS_LABEL,
  AdminEmpty,
  AdminPageHeader,
  PaymentBadge,
  adminFieldClass,
} from "../../_components/admin-ui";
import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { ImpactDeleteModal, type ImpactDeleteTarget } from "../../_components/impact-delete-modal";
import { useIsSuperadmin } from "../../_components/use-superadmin";
import { HistoryBadge, OriginBadge, PaymentStatusBadge } from "./order-badges";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "high", label: "Amount, high to low" },
  { id: "low", label: "Amount, low to high" },
] as const;

// Beautiful, subtle color mapping for the status dropdowns
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200/80",
  new: "bg-blue-50 text-blue-700 border-blue-200/80",
  packed: "bg-green-50 text-green-700 border-green-200/80",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200/80",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  shipped: "bg-sky-50 text-sky-700 border-sky-200/80",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200/80",
  returned: "bg-slate-100 text-slate-700 border-slate-300",
};

export function OrdersList() {
  const params = useSearchParams();
  const router = useRouter();
  const statusParam = params.get("status");
  const originParam = params.get("origin");
  const paymentMethodParam = params.get("payment_method");
  const paymentStatusParam = params.get("payment_status");
  const callStatusParam = params.get("call_status");
  const status = isOrderStatus(statusParam) ? statusParam : null;
  const origin = isOrderOrigin(originParam) ? originParam : null;
  const paymentMethod = isPaymentMethod(paymentMethodParam) ? paymentMethodParam : null;
  const paymentStatus = isPaymentStatus(paymentStatusParam) ? paymentStatusParam : null;
  const callStatus = isCallStatus(callStatusParam) ? callStatusParam : null;
  const sort = SORTS.some((item) => item.id === params.get("sort")) ? (params.get("sort") as (typeof SORTS)[number]["id"]) : "newest";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const dateFrom = params.get("date_from") ?? "";
  const dateTo = params.get("date_to") ?? "";
  const courier = params.get("courier") ?? "";
  const rangeError = dateSpanError(dateFrom, dateTo);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [directory, setDirectory] = useState<OrderDirectory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("confirmed");
  const [printKind, setPrintKind] = useState("both");
  const [reload, setReload] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ImpactDeleteTarget | null>(null);
  const canDelete = useIsSuperadmin();

  useEffect(() => {
    const wanted = query.trim();
    const current = params.get("q") ?? "";
    if (wanted === current) return;
    const handle = window.setTimeout(() => {
      const search = new URLSearchParams(params.toString());
      if (wanted) search.set("q", wanted);
      else search.delete("q");
      search.delete("page");
      const next = search.toString();
      router.replace(next ? `/admin/orders/list?${next}` : "/admin/orders/list", { scroll: false });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, params, router]);

  useEffect(() => {
    if (rangeError) return;
    let cancelled = false;
    void listDeskOrders({
      q: params.get("q") ?? undefined,
      status,
      origin,
      paymentMethod,
      paymentStatus,
      callStatus,
      courier: courier || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      scope: params.get("scope") === "transit" ? "transit" : "all",
      sort,
      page,
      pageSize: 20,
    })
      .then((next) => {
        if (!cancelled) {
          setDirectory(next);
          setError(null);
          setSelected([]);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof MartApiError ? reason.message : "Could not load orders.");
      });
    return () => {
      cancelled = true;
    };
  }, [params, status, origin, paymentMethod, paymentStatus, callStatus, courier, dateFrom, dateTo, sort, page, rangeError, reload]);

  function setParam(key: string, value: string | null) {
    const search = new URLSearchParams(params.toString());
    if (value) search.set(key, value);
    else search.delete(key);
    if (key !== "page") search.delete("page");
    const next = search.toString();
    router.replace(next ? `/admin/orders/list?${next}` : "/admin/orders/list", { scroll: false });
  }

  function hrefFor(nextStatus?: OrderStatus) {
    const search = new URLSearchParams(params.toString());
    search.delete("page");
    if (nextStatus) search.set("status", nextStatus);
    else search.delete("status");
    const next = search.toString();
    return next ? `/admin/orders/list?${next}` : "/admin/orders/list";
  }

  async function changeStatus(order: MartOrder, next: OrderStatus) {
    if ((next === "cancelled" || next === "returned") && !window.confirm(`Mark ${order.number} as ${ADMIN_ORDER_STATUS_LABEL[next]}? Stock goes back. This is not a delete.`)) {
      return;
    }
    try {
      await patchDeskOrder(order.id, { status: next });
      setReload((value) => value + 1);
      setError(null);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update this order.");
    }
  }

  async function changeCall(order: MartOrder, next: CallStatus) {
    try {
      const saved = await patchDeskOrder(order.id, { callStatus: next });
      setDirectory((current) =>
        current ? { ...current, items: current.items.map((item) => (item.id === saved.id ? saved : item)) } : current,
      );
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update the call status.");
    }
  }

  async function applyBulk() {
    if (selected.length === 0) return;
    if ((bulkStatus === "cancelled" || bulkStatus === "returned") && !window.confirm(`Mark ${selected.length} orders as ${ADMIN_ORDER_STATUS_LABEL[bulkStatus]}?`)) {
      return;
    }
    try {
      const results = await bulkOrderStatus(bulkStatus, selected);
      const failed = results.filter((row) => !row.ok);
      setError(failed.length ? failed.map((row) => row.error).filter(Boolean).join(" ") : null);
      setReload((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update these orders.");
    }
  }

  const counts = directory?.statusCounts;
  const allCount = counts ? ORDER_STATUSES.reduce((sum, item) => sum + counts[item], 0) : 0;
  const pageIds = directory?.items.map((order) => order.id) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Order List"
        description="Search by order number, phone, or name. Cancel and return change the status. Nothing is deleted."
        action={
          <Link href="/admin/orders/new" className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            Create Order
          </Link>
        }
      />

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5">
          
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order number, phone, or name..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Filter label="Source" value={origin ?? ""} onChange={(value) => setParam("origin", value || null)}>
              <option value="">All Sources</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </Filter>
            <Filter label="Payment Method" value={paymentMethod ?? ""} onChange={(value) => setParam("payment_method", value || null)}>
              <option value="">Any Method</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{PAYMENT_METHOD_LABEL[method]}</option>
              ))}
            </Filter>
            <Filter label="Payment Status" value={paymentStatus ?? ""} onChange={(value) => setParam("payment_status", value || null)}>
              <option value="">Any Status</option>
              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item}>{PAYMENT_STATUS_LABEL[item]}</option>
              ))}
            </Filter>
            <Filter label="Call Status" value={callStatus ?? ""} onChange={(value) => setParam("call_status", value || null)}>
              <option value="">Any Call Status</option>
              {CALL_STATUSES.map((item) => (
                <option key={item} value={item}>{CALL_STATUS_LABEL[item]}</option>
              ))}
            </Filter>
            
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              From Date
              <input type="date" value={dateFrom} onChange={(event) => setParam("date_from", event.target.value || null)} className={cn(adminFieldClass, "mt-1 h-9 text-sm")} />
            </label>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              To Date
              <input type="date" value={dateTo} onChange={(event) => setParam("date_to", event.target.value || null)} className={cn(adminFieldClass, "mt-1 h-9 text-sm")} />
            </label>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Courier
              <input value={courier} onChange={(event) => setParam("courier", event.target.value || null)} placeholder="Search courier..." className={cn(adminFieldClass, "mt-1 h-9 text-sm")} />
            </label>
            <Filter label="Sort By" value={sort} onChange={(value) => setParam("sort", value === "newest" ? null : value)}>
              {SORTS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </Filter>
          </div>

          {rangeError ? <p className="text-sm font-medium text-rose-600">{rangeError}</p> : null}

          {/* Status Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            <StatusTab href={hrefFor()} label="All" count={allCount} active={!status} />
            {ORDER_STATUSES.map((item) => (
              <StatusTab key={item} href={hrefFor(item)} label={ADMIN_ORDER_STATUS_LABEL[item]} count={counts?.[item] ?? 0} active={status === item} />
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 ? (
          <div className="flex flex-col gap-3 border-b border-indigo-100 bg-indigo-50/50 px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                {selected.length} selected
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select 
                  aria-label="Bulk status" 
                  value={bulkStatus} 
                  onChange={(event) => setBulkStatus(event.target.value as OrderStatus)} 
                  className="h-8 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-indigo-400"
                >
                  {ORDER_STATUSES.map((item) => (
                    <option key={item} value={item}>{ADMIN_ORDER_STATUS_LABEL[item]}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
              
              <button type="button" onClick={() => void applyBulk()} className="h-8 rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                Apply
              </button>
              
              <div className="mx-1 h-4 w-px bg-slate-300" />
              
              <div className="relative">
                <select 
                  aria-label="Print kind" 
                  value={printKind} 
                  onChange={(event) => setPrintKind(event.target.value)} 
                  className="h-8 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-indigo-400"
                >
                  <option value="invoice">Invoice</option>
                  <option value="label">Shipping Label</option>
                  <option value="both">Invoice & Label</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>

              <Link href={`/admin/orders/print?ids=${selected.join(",")}&kind=${printKind}`} className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Print Selected
              </Link>
            </div>
          </div>
        ) : null}

        {error ? <p role="alert" className="bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
        {!directory && !error && !rangeError ? <div className="h-40 animate-pulse bg-slate-50" aria-busy="true" /> : null}
        {directory && directory.items.length === 0 ? <AdminEmpty title="No orders match" detail="Try another status or clear the filters." /> : null}
        
        {directory && directory.items.length > 0 ? (
          /* Single Responsive Table */
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold w-12">#</th>
                  <th className="px-4 py-3 font-semibold">
                    <input type="checkbox" checked={allSelected} aria-label="Select all on this page" onChange={() => setSelected(allSelected ? [] : pageIds)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Call</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  {canDelete ? (
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directory.items.map((order, index) => (
                  <OrderRow
                    key={order.id}
                    rowNumber={(page - 1) * 20 + index + 1}
                    order={order}
                    selected={selected.includes(order.id)}
                    onSelect={(on) => setSelected((current) => on ? [...current, order.id] : current.filter((id) => id !== order.id))}
                    onStatus={changeStatus}
                    onCall={changeCall}
                    canDelete={canDelete}
                    onDelete={() =>
                      setDeleteTarget({
                        entity: "order",
                        id: order.id,
                        label: order.number,
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Pagination */}
        {directory && directory.pages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-medium text-slate-500">
            <span>Page {directory.page} of {directory.pages}</span>
            <div className="flex gap-2">
              <button type="button" className="rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:bg-slate-50 disabled:opacity-50" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
                Previous
              </button>
              <button type="button" className="rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:bg-slate-50 disabled:opacity-50" disabled={page >= directory.pages} onClick={() => setParam("page", String(page + 1))}>
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <ImpactDeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => setReload((value) => value + 1)}
      />
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <div className="relative mt-1">
        <select 
          value={value} 
          onChange={(event) => onChange(event.target.value)} 
          className={cn(
            "h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          )}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

function StatusTab({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "group relative inline-flex shrink-0 items-center gap-2 rounded-t-md px-3 py-2.5 text-sm font-medium transition-colors", 
        active ? "text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {label}
      <span className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors",
        active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
      )}>
        {count}
      </span>
      {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-indigo-600" /> : null}
    </Link>
  );
}

function statusOptions(order: MartOrder) {
  const next = order.nextStatuses ?? nextOrderStatuses(order.status, null);
  return [order.status, ...next.filter((item) => item !== order.status)];
}

function OrderRow({
  rowNumber,
  order,
  selected,
  onSelect,
  onStatus,
  onCall,
  canDelete,
  onDelete,
}: {
  rowNumber: number;
  order: MartOrder;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onStatus: (order: MartOrder, status: OrderStatus) => void;
  onCall: (order: MartOrder, status: CallStatus) => void;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <tr className="group transition-colors hover:bg-slate-50/80">
      <td className="px-4 py-3 text-xs font-medium tabular-nums text-slate-400">
        {rowNumber}
      </td>
      <td className="px-4 py-3">
        <input type="checkbox" checked={selected} aria-label={`Select ${order.number}`} onChange={(event) => onSelect(event.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">{order.number}</Link>
        <span className="mt-0.5 block text-[11px] font-medium text-slate-500">{formatDhakaDateTime(order.orderedAt ?? order.createdAt)}</span>
        {order.duplicateWarning ? <span className="mt-1.5 inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/60">Duplicate in 24h</span> : null}
      </td>
      <td className="px-4 py-3">
        <span className="block text-sm font-medium text-slate-800">{order.customerName}</span>
        <span className="block text-[11px] font-medium text-slate-500">{order.phone}</span>
        {order.customerHistory ? <span className="mt-1.5 block"><HistoryBadge history={order.customerHistory} /></span> : null}
      </td>
      <td className="px-4 py-3"><OriginBadge origin={order.origin} /></td>
      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">{formatTaka(order.total)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <PaymentBadge method={order.paymentMethod} />
        <span className="mt-1.5 block"><PaymentStatusBadge status={order.paymentStatus} /></span>
      </td>
      <td className="px-4 py-3"><CallSelect order={order} onCall={onCall} /></td>
      <td className="px-4 py-3"><StatusSelect order={order} onStatus={onStatus} /></td>
      {canDelete ? (
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <button
            type="button"
            title="Delete order (Admin only)"
            aria-label={`Delete order ${order.number}`}
            onClick={onDelete}
            className="inline-grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <MaterialIcon name="delete_outline" className="text-[18px]" />
          </button>
        </td>
      ) : null}
    </tr>
  );
}

function StatusSelect({ order, onStatus }: { order: MartOrder; onStatus: (order: MartOrder, status: OrderStatus) => void }) {
  const options = statusOptions(order);
  const colorClass = STATUS_COLORS[order.status] || "bg-slate-50 text-slate-700 border-slate-200";
  
  return (
    <div className="relative">
      <select
        aria-label={`Status for ${order.number}`}
        value={order.status}
        disabled={options.length <= 1}
        onChange={(event) => onStatus(order, event.target.value as OrderStatus)}
        className={cn(
          "h-8 w-full appearance-none rounded-md border pl-2.5 pr-7 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-inset focus:ring-indigo-500 disabled:opacity-60",
          colorClass
        )}
      >
        {options.map((status) => (
          <option key={status} value={status}>{ADMIN_ORDER_STATUS_LABEL[status]}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
    </div>
  );
}

function CallSelect({ order, onCall }: { order: MartOrder; onCall: (order: MartOrder, status: CallStatus) => void }) {
  return (
    <div className="relative">
      <select
        aria-label={`Call status for ${order.number}`}
        value={order.callStatus}
        onChange={(event) => onCall(order, event.target.value as CallStatus)}
        className="h-8 w-full appearance-none rounded-md border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {CALL_STATUSES.map((status) => (
          <option key={status} value={status}>{CALL_STATUS_LABEL[status]}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  );
}