"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
import { DuplicateWarning, HistoryBadge, OriginBadge, PaymentStatusBadge } from "./order-badges";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "high", label: "Amount, high to low" },
  { id: "low", label: "Amount, low to high" },
] as const;

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
        title="Order list"
        description="Search by order number, phone, or name. Cancel and return change the status. Nothing is deleted."
        action={
          <Link href="/admin/orders/new" className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-medium text-white">
            Create order
          </Link>
        }
      />
      <section className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <label className="relative block">
            <span className="sr-only">Search orders</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order number, phone, or name"
              className="h-10 w-full rounded-full border border-neutral-200 bg-[#f5f6f8] px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Filter label="Source" value={origin ?? ""} onChange={(value) => setParam("origin", value || null)}>
              <option value="">Online and offline</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </Filter>
            <Filter label="Payment" value={paymentMethod ?? ""} onChange={(value) => setParam("payment_method", value || null)}>
              <option value="">Any payment</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{PAYMENT_METHOD_LABEL[method]}</option>
              ))}
            </Filter>
            <Filter label="Payment status" value={paymentStatus ?? ""} onChange={(value) => setParam("payment_status", value || null)}>
              <option value="">Any payment status</option>
              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item}>{PAYMENT_STATUS_LABEL[item]}</option>
              ))}
            </Filter>
            <Filter label="Call status" value={callStatus ?? ""} onChange={(value) => setParam("call_status", value || null)}>
              <option value="">Any call status</option>
              {CALL_STATUSES.map((item) => (
                <option key={item} value={item}>{CALL_STATUS_LABEL[item]}</option>
              ))}
            </Filter>
            <label className="block text-xs font-medium text-neutral-500">
              From
              <input type="date" value={dateFrom} onChange={(event) => setParam("date_from", event.target.value || null)} className={cn(adminFieldClass, "mt-1")} />
            </label>
            <label className="block text-xs font-medium text-neutral-500">
              To
              <input type="date" value={dateTo} onChange={(event) => setParam("date_to", event.target.value || null)} className={cn(adminFieldClass, "mt-1")} />
            </label>
            <label className="block text-xs font-medium text-neutral-500">
              Courier
              <input value={courier} onChange={(event) => setParam("courier", event.target.value || null)} placeholder="Courier name" className={cn(adminFieldClass, "mt-1")} />
            </label>
            <Filter label="Sort" value={sort} onChange={(value) => setParam("sort", value === "newest" ? null : value)}>
              {SORTS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </Filter>
          </div>
          {rangeError ? <p className="text-sm text-red-600">{rangeError}</p> : null}
          <div className="flex gap-1 overflow-x-auto">
            <StatusTab href={hrefFor()} label="All" count={allCount} active={!status} />
            {ORDER_STATUSES.map((item) => (
              <StatusTab key={item} href={hrefFor(item)} label={ADMIN_ORDER_STATUS_LABEL[item]} count={counts?.[item] ?? 0} active={status === item} />
            ))}
          </div>
        </div>

        {selected.length > 0 ? (
          <div className="flex flex-col gap-2 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-sm font-medium">{selected.length} selected</p>
            <select aria-label="Bulk status" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as OrderStatus)} className="h-10 rounded-full border border-neutral-200 px-3 text-sm">
              {ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>{ADMIN_ORDER_STATUS_LABEL[item]}</option>
              ))}
            </select>
            <button type="button" onClick={() => void applyBulk()} className="h-10 rounded-full bg-neutral-950 px-4 text-sm font-medium text-white">Change status</button>
            <select aria-label="Print kind" value={printKind} onChange={(event) => setPrintKind(event.target.value)} className="h-10 rounded-full border border-neutral-200 px-3 text-sm">
              <option value="invoice">Invoice</option>
              <option value="label">Label</option>
              <option value="both">Invoice and label</option>
            </select>
            <Link href={`/admin/orders/print?ids=${selected.join(",")}&kind=${printKind}`} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ring-1 ring-neutral-200">
              Print
            </Link>
          </div>
        ) : null}

        {error ? <p role="alert" className="px-5 py-4 text-sm text-red-600">{error}</p> : null}
        {!directory && !error && !rangeError ? <div className="h-40 animate-pulse" aria-busy="true" /> : null}
        {directory && directory.items.length === 0 ? <AdminEmpty title="No orders match" detail="Try another status or clear the filters." /> : null}
        {directory && directory.items.length > 0 ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 lg:hidden">
              <input type="checkbox" checked={allSelected} aria-label="Select all on this page" onChange={() => setSelected(allSelected ? [] : pageIds)} />
              <span className="text-sm text-neutral-600">Select page</span>
            </div>
            <ul className="divide-y divide-neutral-100 lg:hidden">
              {directory.items.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  selected={selected.includes(order.id)}
                  onSelect={(on) => setSelected((current) => on ? [...current, order.id] : current.filter((id) => id !== order.id))}
                  onStatus={changeStatus}
                  onCall={changeCall}
                />
              ))}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[68rem] text-left text-sm">
                <thead className="text-xs text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      <input type="checkbox" checked={allSelected} aria-label="Select all on this page" onChange={() => setSelected(allSelected ? [] : pageIds)} />
                    </th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Call</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.items.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      selected={selected.includes(order.id)}
                      onSelect={(on) => setSelected((current) => on ? [...current, order.id] : current.filter((id) => id !== order.id))}
                      onStatus={changeStatus}
                      onCall={changeCall}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
        {directory && directory.pages > 1 ? (
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm">
            <span className="text-neutral-500">Page {directory.page} of {directory.pages}</span>
            <span className="flex gap-2">
              <button type="button" className="rounded-full px-3 py-1 ring-1 ring-neutral-200 disabled:opacity-40" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>Previous</button>
              <button type="button" className="rounded-full px-3 py-1 ring-1 ring-neutral-200 disabled:opacity-40" disabled={page >= directory.pages} onClick={() => setParam("page", String(page + 1))}>Next</button>
            </span>
          </div>
        ) : null}
      </section>
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
    <label className="block text-xs font-medium text-neutral-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={cn(adminFieldClass, "mt-1")}>
        {children}
      </select>
    </label>
  );
}

function StatusTab({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link href={href} className={cn("relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium", active ? "text-neutral-950" : "text-neutral-500")}>
      {label}
      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs tabular-nums">{count}</span>
      {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
    </Link>
  );
}

function statusOptions(order: MartOrder) {
  const next = order.nextStatuses ?? nextOrderStatuses(order.status, null);
  return [order.status, ...next.filter((item) => item !== order.status)];
}

function OrderCard({
  order,
  selected,
  onSelect,
  onStatus,
  onCall,
}: {
  order: MartOrder;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onStatus: (order: MartOrder, status: OrderStatus) => void;
  onCall: (order: MartOrder, status: CallStatus) => void;
}) {
  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={selected} aria-label={`Select ${order.number}`} onChange={(event) => onSelect(event.target.checked)} />
        <div className="min-w-0 flex-1">
          <Link href={`/admin/orders/${order.id}`} className="font-semibold text-neutral-950">{order.number}</Link>
          <p className="truncate text-xs text-neutral-500">{order.customerName} · {order.phone}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <OriginBadge origin={order.origin} />
            <PaymentBadge method={order.paymentMethod} />
            <PaymentStatusBadge status={order.paymentStatus} />
            {order.customerHistory ? <HistoryBadge history={order.customerHistory} /> : null}
          </div>
          {order.duplicateWarning ? <div className="mt-2"><DuplicateWarning /></div> : null}
        </div>
        <span className="text-sm font-semibold tabular-nums">{formatTaka(order.total)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatusSelect order={order} onStatus={onStatus} />
        <CallSelect order={order} onCall={onCall} />
      </div>
    </li>
  );
}

function OrderRow({
  order,
  selected,
  onSelect,
  onStatus,
  onCall,
}: {
  order: MartOrder;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onStatus: (order: MartOrder, status: OrderStatus) => void;
  onCall: (order: MartOrder, status: CallStatus) => void;
}) {
  return (
    <tr className="border-t border-neutral-100">
      <td className="px-4 py-3">
        <input type="checkbox" checked={selected} aria-label={`Select ${order.number}`} onChange={(event) => onSelect(event.target.checked)} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-neutral-950 hover:text-primary">{order.number}</Link>
        <span className="block text-xs text-neutral-500">{formatDhakaDateTime(order.orderedAt ?? order.createdAt)}</span>
        {order.duplicateWarning ? <span className="mt-1 block text-xs font-medium text-amber-800">Duplicate in 24h</span> : null}
      </td>
      <td className="px-4 py-3">
        <span className="block">{order.customerName}</span>
        <span className="block text-xs text-neutral-500">{order.phone}</span>
        {order.customerHistory ? <span className="mt-1 block"><HistoryBadge history={order.customerHistory} /></span> : null}
      </td>
      <td className="px-4 py-3"><OriginBadge origin={order.origin} /></td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatTaka(order.total)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <PaymentBadge method={order.paymentMethod} />
        <span className="mt-1 block"><PaymentStatusBadge status={order.paymentStatus} /></span>
      </td>
      <td className="px-4 py-3"><CallSelect order={order} onCall={onCall} /></td>
      <td className="px-4 py-3"><StatusSelect order={order} onStatus={onStatus} /></td>
    </tr>
  );
}

function StatusSelect({ order, onStatus }: { order: MartOrder; onStatus: (order: MartOrder, status: OrderStatus) => void }) {
  const options = statusOptions(order);
  return (
    <select
      aria-label={`Status for ${order.number}`}
      value={order.status}
      disabled={options.length <= 1}
      onChange={(event) => onStatus(order, event.target.value as OrderStatus)}
      className="h-9 rounded-full border border-neutral-200 bg-white px-2 text-xs font-semibold"
    >
      {options.map((status) => (
        <option key={status} value={status}>{ADMIN_ORDER_STATUS_LABEL[status]}</option>
      ))}
    </select>
  );
}

function CallSelect({ order, onCall }: { order: MartOrder; onCall: (order: MartOrder, status: CallStatus) => void }) {
  return (
    <label className="block">
      <span className="sr-only">Call status for {order.number}</span>
      <select
        aria-label={`Call status for ${order.number}`}
        value={order.callStatus}
        onChange={(event) => onCall(order, event.target.value as CallStatus)}
        className="h-9 max-w-full rounded-full border border-neutral-200 bg-white px-2 text-xs"
      >
        {CALL_STATUSES.map((status) => (
          <option key={status} value={status}>{CALL_STATUS_LABEL[status]}</option>
        ))}
      </select>
    </label>
  );
}
