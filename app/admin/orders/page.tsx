"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { useOrders } from "@/lib/mart-mock/hooks";
import {
  formatTaka,
  ORDER_STATUSES,
  orderGrandTotal,
  phoneDigits,
  type MockOrder,
  type OrderStatus,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { ADMIN_ORDER_STATUS_LABEL, AdminLoading, OrderStatusBadge } from "../_components/admin-ui";

function isOrderStatus(value: string | null): value is OrderStatus {
  return ORDER_STATUSES.some((status) => status === value);
}

function OrdersView() {
  const params = useSearchParams();
  const raw = params.get("status");
  const active = isOrderStatus(raw) ? raw : "all";
  const orders = useOrders();
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders]);

  const counts = useMemo(() => {
    const next = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, 0]),
    ) as Record<OrderStatus, number>;
    for (const order of sorted) next[order.status] += 1;
    return next;
  }, [sorted]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const digits = phoneDigits(query);
    return sorted.filter((order) => {
      if (active !== "all" && order.status !== active) return false;
      if (!needle) return true;
      const haystack = [
        order.number,
        order.customerName,
        order.phone,
        ...order.items.map((item) => item.title),
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(needle)) return true;
      return digits.length >= 3 && phoneDigits(order.phone).includes(digits);
    });
  }, [active, query, sorted]);

  if (!orders) return <AdminLoading />;

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">
            {query.trim()
              ? `${visible.length} matching`
              : `${visible.length} ${visible.length === 1 ? "order" : "orders"}`}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Newest first. Open a row for details.
          </p>
        </div>
        <label className="relative block w-full sm:w-80">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Order, name, phone, or product"
            aria-label="Search orders"
            className="h-10 w-full rounded-xl border border-neutral-200 bg-[#f5f6f8] pr-3 pl-10 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
          />
        </label>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-2">
        <StatusTab
          href="/admin/orders"
          label="All"
          count={sorted.length}
          active={active === "all"}
        />
        {ORDER_STATUSES.map((status) => (
          <StatusTab
            key={status}
            href={`/admin/orders?status=${status}`}
            label={ADMIN_ORDER_STATUS_LABEL[status]}
            count={counts[status]}
            active={active === status}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-neutral-500">
          {query.trim()
            ? "No orders match this search."
            : "No orders in this status."}
        </p>
      ) : (
        <>
          <ul className="flex flex-col lg:hidden">
            {visible.map((order) => (
              <li
                key={order.number}
                className="border-b border-neutral-100 last:border-b-0"
              >
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-16 z-10 bg-[#f7f8fa] text-xs text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <OrderTableRow key={order.number} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function StatusTab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium",
        active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-800",
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
          active
            ? "bg-primary/10 text-primary"
            : "bg-neutral-100 text-neutral-500",
        )}
      >
        {count}
      </span>
      {active ? (
        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
      ) : null}
    </Link>
  );
}

function OrderCard({ order }: { order: MockOrder }) {
  const item = order.items[0];
  return (
    <Link
      href={`/admin/orders/${order.number}`}
      className="flex items-start gap-3 px-4 py-3.5"
    >
      <ProductThumb item={item} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-neutral-950">
              {order.number}
            </span>
            <span className="mt-0.5 block text-xs text-neutral-500">
              {formatOrderWhen(order.createdAt)}
            </span>
          </span>
          <OrderStatusBadge status={order.status} />
        </span>
        <span className="mt-2 block truncate text-sm text-neutral-800">
          {order.customerName}
        </span>
        <span className="mt-0.5 block truncate text-xs text-neutral-500">
          {itemSummary(order)}
        </span>
        <span className="mt-2 flex items-center justify-between gap-3 text-sm">
          <span className="tabular-nums text-neutral-500">{order.phone}</span>
          <span className="font-semibold tabular-nums text-neutral-950">
            {formatTaka(orderGrandTotal(order))}
          </span>
        </span>
      </span>
    </Link>
  );
}

function OrderTableRow({ order }: { order: MockOrder }) {
  const router = useRouter();
  const item = order.items[0];
  const href = `/admin/orders/${order.number}`;
  return (
    <tr
      className="cursor-pointer border-t border-neutral-100 transition-colors hover:bg-neutral-50"
      onClick={() => router.push(href)}
    >
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-3">
          <ProductThumb item={item} />
          <span>
            <Link
              href={href}
              className="block font-semibold text-neutral-950"
              onClick={(event) => event.stopPropagation()}
            >
              {order.number}
            </Link>
            <span className="block text-xs text-neutral-500">
              {formatOrderWhen(order.createdAt)}
            </span>
          </span>
        </span>
      </td>
      <td className="px-5 py-3.5 text-neutral-800">{order.customerName}</td>
      <td className="max-w-md px-5 py-3.5">
        <span className="block truncate text-neutral-700">
          {item ? item.title : "—"}
        </span>
        <span className="block text-xs text-neutral-400">
          {itemMeta(order)}
        </span>
      </td>
      <td className="px-5 py-3.5 tabular-nums text-neutral-600">
        {order.phone}
      </td>
      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-neutral-950">
        {formatTaka(orderGrandTotal(order))}
      </td>
      <td className="px-5 py-3.5">
        <OrderStatusBadge status={order.status} />
      </td>
    </tr>
  );
}

function ProductThumb({ item }: { item?: MockOrder["items"][number] }) {
  if (!item)
    return <span className="size-10 shrink-0 rounded-xl bg-neutral-100" />;
  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
      <Image
        src={item.imageSrc}
        alt=""
        fill
        sizes="40px"
        className="object-cover"
      />
    </span>
  );
}

function itemSummary(order: MockOrder) {
  const item = order.items[0];
  if (!item) return "No products";
  const extra = order.items.length - 1;
  return extra > 0 ? `${item.title} +${extra}` : item.title;
}

function itemMeta(order: MockOrder) {
  const qty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  if (order.items.length > 1)
    return `${order.items.length} products · ${qty} pcs`;
  return `${qty} pcs`;
}

function formatOrderWhen(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <OrdersView />
    </Suspense>
  );
}
