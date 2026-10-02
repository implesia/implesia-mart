"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { listOrders, patchOrder, type MartOrder, type OrderDirectory } from "@/lib/mart-api/orders";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka, ORDER_STATUSES, type OrderStatus } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_ORDER_STATUS_LABEL,
  AdminEmpty,
  AdminPageHeader,
  ORDER_STATUS_TONE,
  PaymentBadge,
} from "../_components/admin-ui";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "high", label: "Amount, high to low" },
  { id: "low", label: "Amount, low to high" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

function isOrderStatus(value: string | null): value is OrderStatus {
  return ORDER_STATUSES.some((status) => status === value);
}

function isSort(value: string | null): value is SortId {
  return SORTS.some((sort) => sort.id === value);
}

function OrdersView() {
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get("status");
  const active = isOrderStatus(raw) ? raw : "all";
  const inTransit = params.get("lane") === "transit";
  const sort: SortId = isSort(params.get("sort")) ? (params.get("sort") as SortId) : "newest";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [directory, setDirectory] = useState<OrderDirectory | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      router.replace(next ? `/admin/orders?${next}` : "/admin/orders", { scroll: false });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, params, router]);

  useEffect(() => {
    let cancelled = false;
    void listOrders({
      q: params.get("q") ?? undefined,
      status: active === "all" ? null : active,
      scope: inTransit ? "transit" : "all",
      sort,
      page,
    })
      .then((next) => {
        if (!cancelled) {
          setDirectory(next);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof MartApiError ? reason.message : "Could not load orders.");
      });
    return () => {
      cancelled = true;
    };
  }, [params, active, inTransit, sort, page, reload]);

  function setParam(key: string, value: string | null) {
    const search = new URLSearchParams(params.toString());
    if (value) search.set(key, value);
    else search.delete(key);
    if (key !== "page") search.delete("page");
    const next = search.toString();
    router.replace(next ? `/admin/orders?${next}` : "/admin/orders", { scroll: false });
  }

  function ordersHref(status?: OrderStatus) {
    const search = new URLSearchParams(params.toString());
    search.delete("page");
    search.delete("lane");
    if (status) search.set("status", status);
    else search.delete("status");
    const next = search.toString();
    return next ? `/admin/orders?${next}` : "/admin/orders";
  }

  async function changeStatus(order: MartOrder, status: OrderStatus) {
    try {
      const saved = await patchOrder(order.id, { status });
      setDirectory((current) =>
        current
          ? { ...current, items: current.items.map((item) => (item.id === saved.id ? saved : item)) }
          : current,
      );
      setReload((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof MartApiError ? reason.message : "Could not update this order.");
    }
  }

  const metrics = directory?.metrics;

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Orders"
        description="Cash on delivery. Prices and stock are taken on the server when the order is placed."
      />

      <section aria-label="Order summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric href={ordersHref()} label="Orders" value={metrics ? String(metrics.orders) : "—"} hint="All orders" active={active === "all" && !inTransit} />
        <Metric href={ordersHref("new")} label="To confirm" value={metrics ? String(metrics.new) : "—"} hint="New orders waiting on you" active={active === "new"} />
        <Metric
          href="/admin/orders?lane=transit"
          label="In transit"
          value={metrics ? String(metrics.inTransit) : "—"}
          hint="Confirmed or shipped"
          active={inTransit}
        />
        <Metric label="Revenue" value={metrics ? formatTaka(metrics.revenue) : "—"} hint="Excludes cancelled and returned" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block min-w-0 flex-1">
              <MaterialIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order number, name, phone, or product"
                className="h-10 w-full rounded-full border border-neutral-200 bg-[#f5f6f8] pr-3 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </label>
            <label className="sr-only" htmlFor="order-sort">Sort</label>
            <select
              id="order-sort"
              value={sort}
              onChange={(event) => setParam("sort", event.target.value === "newest" ? null : event.target.value)}
              className="h-10 rounded-full border border-neutral-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {SORTS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            <StatusTab href={ordersHref()} label="All" count={metrics?.orders ?? 0} active={active === "all" && !inTransit} />
            {ORDER_STATUSES.map((status) => (
              <StatusTab
                key={status}
                href={ordersHref(status)}
                label={ADMIN_ORDER_STATUS_LABEL[status]}
                count={metrics?.[status] ?? 0}
                active={active === status}
              />
            ))}
          </div>
        </div>

        {error ? <p className="px-5 py-4 text-sm text-red-500">{error}</p> : null}
        {!directory && !error ? <div className="h-40 animate-pulse" aria-busy="true" /> : null}
        {directory && directory.items.length === 0 ? (
          <AdminEmpty title="No orders yet" detail="A checkout order will show up here with the server price." />
        ) : null}
        {directory && directory.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {directory.items.map((order) => (
                  <OrderTableRow key={order.id} order={order} onStatus={changeStatus} />
                ))}
              </tbody>
            </table>
          </div>
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

function Metric({
  href,
  label,
  value,
  hint,
  active,
}: {
  href?: string;
  label: string;
  value: string;
  hint: string;
  active?: boolean;
}) {
  const className = cn(
    "rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90",
    active && "ring-primary",
  );
  const body = (
    <>
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </>
  );
  if (!href) return <div className={className}>{body}</div>;
  return <Link href={href} className={className}>{body}</Link>;
}

function StatusTab({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium",
        active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-800",
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 py-0.5 text-xs tabular-nums", active ? "bg-primary/10 text-[#0b3d39]" : "bg-neutral-100 text-neutral-500")}>{count}</span>
      {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
    </Link>
  );
}

function OrderTableRow({
  order,
  onStatus,
}: {
  order: MartOrder;
  onStatus: (order: MartOrder, status: OrderStatus) => void;
}) {
  const router = useRouter();
  const item = order.items[0];
  const href = `/admin/orders/${order.id}`;
  return (
    <tr className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50" onClick={() => router.push(href)}>
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={href} className="font-semibold text-neutral-950 hover:text-primary" onClick={(event) => event.stopPropagation()}>
          {order.number}
        </Link>
        <span className="block text-xs text-neutral-500">{formatWhen(order.createdAt)}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="block text-neutral-800">{order.customerName}</span>
        <span className="block text-xs text-neutral-500">{order.district} · {order.area}</span>
      </td>
      <td className="max-w-xs px-4 py-3">
        <span className="flex items-center gap-2">
          {item?.imageSrc ? (
            <span className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              <Image src={item.imageSrc} alt="" fill sizes="32px" className="object-cover" />
            </span>
          ) : null}
          <span className="min-w-0">
            <span className="block truncate text-neutral-700">{item ? item.title : "—"}</span>
            <span className="block text-xs text-neutral-500">{order.items.reduce((sum, line) => sum + line.quantity, 0)} pcs</span>
          </span>
        </span>
      </td>
      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{formatTaka(order.total)}</td>
      <td className="px-4 py-3 whitespace-nowrap"><PaymentBadge /></td>
      <td className="px-4 py-3 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
        <select
          aria-label={`Status for ${order.number}`}
          value={order.status}
          onChange={(event) => onStatus(order, event.target.value as OrderStatus)}
          className={cn("h-8 cursor-pointer appearance-none rounded-full py-0 pr-7 pl-2.5 text-xs font-semibold outline-none", ORDER_STATUS_TONE[order.status])}
        >
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>{ADMIN_ORDER_STATUS_LABEL[status]}</option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />}>
      <OrdersView />
    </Suspense>
  );
}
