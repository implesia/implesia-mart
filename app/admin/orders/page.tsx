"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { useOrders } from "@/lib/mart-mock/hooks";
import {
  formatTaka,
  isSameLocalDay,
  ORDER_STATUSES,
  orderGrandTotal,
  phoneDigits,
  updateOrder,
  type MockOrder,
  type OrderStatus,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_ORDER_STATUS_LABEL,
  AdminLoading,
  ORDER_STATUS_TONE,
} from "../_components/admin-ui";

const PAGE_SIZE = 10;

function isOrderStatus(value: string | null): value is OrderStatus {
  return ORDER_STATUSES.some((status) => status === value);
}

function OrdersView() {
  const params = useSearchParams();
  const raw = params.get("status");
  const active = isOrderStatus(raw) ? raw : "all";
  const todayOnly = params.get("day") === "today";
  const inTransit = params.get("lane") === "transit";
  const orders = useOrders();
  const [query, setQuery] = useState("");
  const [pageState, setPageState] = useState({ key: "", page: 0 });

  const pool = useMemo(() => {
    if (!orders) return [];
    const newest = [...orders].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return todayOnly
      ? newest.filter((order) => isSameLocalDay(order.createdAt))
      : newest;
  }, [orders, todayOnly]);

  const counts = useMemo(() => {
    const next = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, 0]),
    ) as Record<OrderStatus, number>;
    for (const order of pool) next[order.status] += 1;
    return next;
  }, [pool]);

  const sorted = useMemo(() => {
    if (!inTransit || active !== "all") return pool;
    return pool.filter(
      (order) => order.status === "confirmed" || order.status === "shipped",
    );
  }, [active, inTransit, pool]);

  function ordersHref(status?: OrderStatus) {
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    if (todayOnly) search.set("day", "today");
    const queryString = search.toString();
    return queryString ? `/admin/orders?${queryString}` : "/admin/orders";
  }

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

  const filterKey = `${active}|${todayOnly ? "today" : ""}|${inTransit ? "transit" : ""}|${query}`;
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const storedPage = pageState.key === filterKey ? pageState.page : 0;
  const page = Math.min(storedPage, pageCount - 1);
  const pageRows = visible.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  function goToPage(next: number) {
    setPageState({ key: filterKey, page: next });
  }

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
            {inTransit
              ? "Confirmed or shipped. Newest first."
              : todayOnly
                ? "Placed today. Newest first."
                : "Newest first."}
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

      {todayOnly || inTransit ? (
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-primary/5 px-4 py-2 text-sm sm:px-5">
          <p className="text-neutral-700">
            {inTransit
              ? "Showing confirmed and shipped orders."
              : "Showing today’s orders."}
          </p>
          <Link
            href={
              active === "all"
                ? "/admin/orders"
                : `/admin/orders?status=${active}`
            }
            className="shrink-0 font-medium text-primary"
          >
            {inTransit ? "Show every order" : "Show all days"}
          </Link>
        </div>
      ) : null}

      <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-2">
        <StatusTab
          href={inTransit ? "/admin/orders?lane=transit" : ordersHref()}
          label="All"
          count={inTransit ? counts.confirmed + counts.shipped : pool.length}
          active={active === "all"}
        />
        {ORDER_STATUSES.map((status) => (
          <StatusTab
            key={status}
            href={ordersHref(status)}
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
            : inTransit
              ? "No orders in transit."
              : todayOnly
                ? "No orders today."
                : "No orders in this status."}
        </p>
      ) : (
        <>
          <ul className="flex flex-col lg:hidden">
            {pageRows.map((order, index) => (
              <li
                key={order.number}
                className="border-b border-neutral-100 last:border-b-0"
              >
                <OrderCard order={order} index={page * PAGE_SIZE + index + 1} />
              </li>
            ))}
          </ul>
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-16 z-10 bg-[#f7f8fa] text-xs text-neutral-500">
                <tr>
                  <th className="w-12 px-4 py-3 text-right font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((order, index) => (
                  <OrderTableRow
                    key={order.number}
                    order={order}
                    index={page * PAGE_SIZE + index + 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <OrdersPager
            page={page}
            pageCount={pageCount}
            total={visible.length}
            onPage={goToPage}
          />
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

function OrderCard({ order, index }: { order: MockOrder; index: number }) {
  const item = order.items[0];
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <span className="w-5 shrink-0 pt-1 text-right text-xs tabular-nums text-neutral-400">
        {index}
      </span>
      <Link
        href={`/admin/orders/${order.number}`}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <ProductThumb item={item} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-neutral-950">
            {order.number}
          </span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            {formatOrderWhen(order.createdAt)}
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
      <StatusSelect order={order} />
    </div>
  );
}

function OrderTableRow({ order, index }: { order: MockOrder; index: number }) {
  const router = useRouter();
  const item = order.items[0];
  const href = `/admin/orders/${order.number}`;
  return (
    <tr
      className="cursor-pointer border-t border-neutral-100 transition-colors hover:bg-neutral-50"
      onClick={() => router.push(href)}
    >
      <td className="px-4 py-3 text-right text-xs tabular-nums text-neutral-400">
        {index}
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-3">
          <ProductThumb item={item} />
          <span>
            <Link
              href={href}
              className="block font-semibold text-neutral-950 hover:text-primary"
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
      <td className="px-4 py-3 text-neutral-800">{order.customerName}</td>
      <td className="max-w-md px-4 py-3">
        <span className="block truncate text-neutral-700">
          {item ? item.title : "—"}
        </span>
        <span className="block text-xs text-neutral-400">
          {itemMeta(order)}
        </span>
      </td>
      <td className="px-4 py-3 tabular-nums text-neutral-600">
        <a
          href={`tel:${order.phone}`}
          className="hover:text-primary"
          onClick={(event) => event.stopPropagation()}
        >
          {order.phone}
        </a>
      </td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums text-neutral-950">
        {formatTaka(orderGrandTotal(order))}
      </td>
      <td className="px-4 py-3">
        <StatusSelect order={order} />
      </td>
    </tr>
  );
}

function StatusSelect({ order }: { order: MockOrder }) {
  return (
    <span
      className="relative inline-flex shrink-0"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <select
        aria-label={`Status for ${order.number}`}
        value={order.status}
        onChange={(event) =>
          updateOrder(order.number, {
            status: event.target.value as OrderStatus,
          })
        }
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-full py-0 pr-7 pl-2.5 text-xs font-semibold outline-none",
          ORDER_STATUS_TONE[order.status],
        )}
      >
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ADMIN_ORDER_STATUS_LABEL[status]}
          </option>
        ))}
      </select>
      <MaterialIcon
        name="expand_more"
        className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-[16px]"
      />
    </span>
  );
}

function OrdersPager({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  const start = page * PAGE_SIZE + 1;
  const end = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
      <p className="text-xs text-neutral-500">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="grid size-8 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:text-neutral-300"
        >
          <MaterialIcon name="chevron_left" className="text-[20px]" />
        </button>
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Page ${index + 1}`}
            aria-current={index === page ? "page" : undefined}
            onClick={() => onPage(index)}
            className={cn(
              "grid size-8 place-items-center rounded-full text-sm font-medium",
              index === page
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {index + 1}
          </button>
        ))}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount - 1}
          onClick={() => onPage(page + 1)}
          className="grid size-8 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:text-neutral-300"
        >
          <MaterialIcon name="chevron_right" className="text-[20px]" />
        </button>
      </div>
    </div>
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
