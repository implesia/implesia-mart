"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { areaName } from "@/lib/mart-mock/dashboard";
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
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
  ORDER_STATUS_TONE,
  PaymentBadge,
} from "../_components/admin-ui";

const PAGE_SIZE = 10;
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
  const todayOnly = params.get("day") === "today";
  const inTransit = params.get("lane") === "transit";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const minAmount = params.get("min") ?? "";
  const maxAmount = params.get("max") ?? "";
  const sort: SortId = isSort(params.get("sort")) ? (params.get("sort") as SortId) : "newest";
  const orders = useOrders();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(Boolean(from || to || minAmount || maxAmount));
  const [pageState, setPageState] = useState({ key: "", page: 0 });

  function setParam(key: string, value: string | null) {
    const search = new URLSearchParams(params.toString());
    if (value) search.set(key, value);
    else search.delete(key);
    const next = search.toString();
    router.replace(next ? `/admin/orders?${next}` : "/admin/orders", { scroll: false });
  }

  function ordersHref(status?: OrderStatus) {
    const search = new URLSearchParams(params.toString());
    if (status) {
      search.set("status", status);
      search.delete("lane");
    } else search.delete("status");
    const next = search.toString();
    return next ? `/admin/orders?${next}` : "/admin/orders";
  }

  if (!orders) return <OrdersSkeleton />;

  const windowOrders = orders.filter((order) => inDateWindow(order, { todayOnly, from, to }) && inAmountWindow(order, minAmount, maxAmount));
  const pool = inTransit
    ? windowOrders.filter((order) => order.status === "confirmed" || order.status === "shipped")
    : windowOrders;
  const counts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as Record<OrderStatus, number>;
  for (const order of pool) counts[order.status] += 1;
  const revenue = windowOrders
    .filter((order) => order.status !== "cancelled" && order.status !== "returned")
    .reduce((sum, order) => sum + orderGrandTotal(order), 0);
  const pending = windowOrders.filter((order) => order.status === "new").length;
  const transit = windowOrders.filter((order) => order.status === "confirmed" || order.status === "shipped").length;

  const needle = query.trim().toLowerCase();
  const digits = phoneDigits(query);
  const matched = pool.filter((order) => {
    if (active !== "all" && order.status !== active) return false;
    if (!needle) return true;
    const haystack = [order.number, order.customerName, order.phone, order.address, ...order.items.map((item) => item.title)]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(needle)) return true;
    return digits.length >= 3 && phoneDigits(order.phone).includes(digits);
  });
  const visible = [...matched].sort((a, b) => compareOrders(a, b, sort));

  const filterKey = `${params.toString()}|${query}`;
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const storedPage = pageState.key === filterKey ? pageState.page : 0;
  const page = Math.min(storedPage, pageCount - 1);
  const pageRows = visible.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const advanced = Boolean(from || to || minAmount || maxAmount || sort !== "newest");
  const scoped = todayOnly || inTransit || active !== "all" || advanced || Boolean(query.trim());

  function clearFilters() {
    setQuery("");
    setFiltersOpen(false);
    router.replace("/admin/orders", { scroll: false });
  }

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader title="Orders" description="Manage, track, and monitor customer orders." />

      <section aria-label="Order summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          href={ordersHref()}
          label="Orders"
          value={String(pool.length)}
          hint={inTransit ? "Confirmed or shipped in this view" : "In the current date and amount view"}
          active={active === "all" && !inTransit}
        />
        <Metric
          href={ordersHref("new")}
          label="To confirm"
          value={String(pending)}
          hint="New orders waiting on you"
          active={active === "new"}
        />
        <Metric
          href={withLane(params, true)}
          label="In transit"
          value={String(transit)}
          hint="Confirmed or shipped"
          active={inTransit}
        />
        <Metric label="Revenue" value={formatTaka(revenue)} hint="Excludes cancelled and returned" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block min-w-0 flex-1">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Order, customer, phone, product, or area"
                aria-label="Search orders"
                className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle pr-3 pl-10 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MaterialIcon name="tune" className="text-[18px]" />
                Filters
                {advanced ? <span className="rounded-full bg-primary/10 px-1.5 text-xs text-[#0b3d39]">On</span> : null}
              </button>
              <label className="min-w-40">
                <span className="sr-only">Sort orders</span>
                <select
                  value={sort}
                  onChange={(event) => setParam("sort", event.target.value === "newest" ? null : event.target.value)}
                  className="h-10 w-full rounded-full border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25"
                >
                  {SORTS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {scoped ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
          {filtersOpen ? (
            <div className="grid gap-3 border-t border-neutral-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterDate label="From" value={from} onChange={(value) => setParam("from", value || null)} />
              <FilterDate label="To" value={to} onChange={(value) => setParam("to", value || null)} />
              <FilterAmount label="Min amount" value={minAmount} onChange={(value) => setParam("min", value || null)} />
              <FilterAmount label="Max amount" value={maxAmount} onChange={(value) => setParam("max", value || null)} />
            </div>
          ) : null}
          <ActiveFilters
            todayOnly={todayOnly}
            inTransit={inTransit}
            status={active}
            from={from}
            to={to}
            minAmount={minAmount}
            maxAmount={maxAmount}
            onClear={setParam}
          />
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-2">
          <StatusTab href={ordersHref()} label="All" count={pool.length} active={active === "all"} />
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
          <AdminEmpty
            title={orders.length === 0 ? "No orders yet" : "No orders found for the selected filters."}
            detail={orders.length === 0 ? undefined : "Clear a filter or try another search."}
          />
        ) : (
          <>
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[64rem] border-separate border-spacing-0 text-left text-sm">
                <caption className="sr-only">Orders. Scroll sideways to see every column.</caption>
                <thead className="text-xs text-neutral-500">
                  <tr>
                    <th className="w-12 border-b border-neutral-200 bg-admin-subtle px-4 py-3 text-right font-medium lg:sticky lg:left-0 lg:z-20">
                      #
                    </th>
                    <th className="min-w-44 border-b border-neutral-200 bg-admin-subtle px-4 py-3 font-medium lg:sticky lg:left-12 lg:z-20 lg:border-r">
                      Order
                    </th>
                    <th className="border-b border-neutral-200 bg-admin-subtle px-4 py-3 font-medium">Customer</th>
                    <th className="border-b border-neutral-200 bg-admin-subtle px-4 py-3 font-medium">Items</th>
                    <th className="border-b border-neutral-200 bg-admin-subtle px-4 py-3 text-right font-medium">Amount</th>
                    <th className="border-b border-neutral-200 bg-admin-subtle px-4 py-3 font-medium">Payment</th>
                    <th className="border-b border-neutral-200 bg-admin-subtle px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((order, index) => (
                    <OrderTableRow key={order.number} order={order} index={page * PAGE_SIZE + index + 1} />
                  ))}
                </tbody>
              </table>
            </div>
            <OrdersPager
              page={page}
              pageCount={pageCount}
              total={visible.length}
              onPage={(next) => setPageState({ key: filterKey, page: next })}
            />
          </>
        )}
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
    "flex flex-col rounded-2xl bg-white px-4 py-3 ring-1 transition-colors",
    active ? "ring-primary" : "ring-neutral-200/90",
    href && "hover:ring-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  );
  const body = (
    <>
      <span className="text-sm text-neutral-600">{label}</span>
      <span className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-neutral-950">{value}</span>
      <span className="mt-1 text-xs leading-4 text-neutral-500">{hint}</span>
    </>
  );
  if (!href) return <article className={className}>{body}</article>;
  return (
    <Link href={href} className={className} aria-current={active ? "true" : undefined}>
      {body}
    </Link>
  );
}

function ActiveFilters({
  todayOnly,
  inTransit,
  status,
  from,
  to,
  minAmount,
  maxAmount,
  onClear,
}: {
  todayOnly: boolean;
  inTransit: boolean;
  status: OrderStatus | "all";
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  onClear: (key: string, value: string | null) => void;
}) {
  const chips = [
    todayOnly ? { key: "day", label: "Today" } : null,
    inTransit ? { key: "lane", label: "In transit" } : null,
    status !== "all" ? { key: "status", label: ADMIN_ORDER_STATUS_LABEL[status] } : null,
    from ? { key: "from", label: `From ${from}` } : null,
    to ? { key: "to", label: `To ${to}` } : null,
    minAmount ? { key: "min", label: `Min ${formatTaka(Number(minAmount) || 0)}` } : null,
    maxAmount ? { key: "max", label: `Max ${formatTaka(Number(maxAmount) || 0)}` } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => onClear(chip.key, null)}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-neutral-100 px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {chip.label}
            <MaterialIcon name="close" className="text-[14px]" />
            <span className="sr-only">Remove {chip.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle px-3 text-sm text-neutral-950 outline-none focus:border-primary focus:ring-3 focus:ring-primary/25"
      />
    </label>
  );
}

function FilterAmount({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))}
        placeholder="৳"
        className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle px-3 text-sm text-neutral-950 outline-none focus:border-primary focus:ring-3 focus:ring-primary/25"
      />
    </label>
  );
}

function StatusTab({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-800",
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
      <span className={cn("rounded-full px-1.5 py-0.5 text-xs tabular-nums", active ? "bg-primary/10 text-[#0b3d39]" : "bg-neutral-100 text-neutral-500")}>
        {count}
      </span>
      {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
    </Link>
  );
}

function OrderTableRow({ order, index }: { order: MockOrder; index: number }) {
  const router = useRouter();
  const item = order.items[0];
  const href = `/admin/orders/${order.number}`;
  const pinned = "border-b border-neutral-100 lg:sticky lg:z-10 lg:bg-white lg:group-hover:bg-neutral-50";
  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-neutral-50"
      onClick={() => router.push(href)}
    >
      <td className={cn(pinned, "px-4 py-3 text-right text-xs tabular-nums text-neutral-400 lg:left-0")}>{index}</td>
      <td className={cn(pinned, "min-w-44 px-4 py-3 lg:left-12 lg:border-r lg:border-neutral-200")}>
        <span className="flex items-center gap-3 whitespace-nowrap">
          <ProductThumb item={item} />
          <span>
            <Link href={href} className="font-semibold text-neutral-950 hover:text-primary" onClick={(event) => event.stopPropagation()}>
              {order.number}
            </Link>
            <span className="block text-xs text-neutral-500">{formatOrderWhen(order.createdAt)}</span>
          </span>
        </span>
      </td>
      <td className="border-b border-neutral-100 px-4 py-3 whitespace-nowrap">
        <span className="block text-neutral-800">{order.customerName}</span>
        <span className="block text-xs text-neutral-500">{areaName(order.address)}</span>
      </td>
      <td className="max-w-xs border-b border-neutral-100 px-4 py-3">
        <span className="block truncate text-neutral-700" title={item ? item.title : undefined}>
          {itemSummary(order)}
        </span>
        <span className="block text-xs text-neutral-500">{itemMeta(order)}</span>
      </td>
      <td className="border-b border-neutral-100 px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums text-neutral-950">
        {formatTaka(orderGrandTotal(order))}
      </td>
      <td className="border-b border-neutral-100 px-4 py-3 whitespace-nowrap">
        <PaymentBadge />
      </td>
      <td className="border-b border-neutral-100 px-4 py-3 whitespace-nowrap">
        <StatusSelect order={order} />
      </td>
    </tr>
  );
}

function StatusSelect({ order }: { order: MockOrder }) {
  return (
    <span className="relative inline-flex shrink-0" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
      <select
        aria-label={`Status for ${order.number}`}
        value={order.status}
        onChange={(event) => updateOrder(order.number, { status: event.target.value as OrderStatus })}
        className={cn("h-8 cursor-pointer appearance-none rounded-full py-0 pr-7 pl-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary/40", ORDER_STATUS_TONE[order.status])}
      >
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ADMIN_ORDER_STATUS_LABEL[status]}
          </option>
        ))}
      </select>
      <MaterialIcon name="expand_more" className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-[16px]" />
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
  if (total <= PAGE_SIZE) return null;
  const start = page * PAGE_SIZE + 1;
  const end = Math.min(total, (page + 1) * PAGE_SIZE);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3">
      <p className="text-xs text-neutral-500">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <PagerButton label="Previous page" disabled={page === 0} onClick={() => onPage(page - 1)} icon="chevron_left" />
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Page ${index + 1}`}
            aria-current={index === page ? "page" : undefined}
            onClick={() => onPage(index)}
            className={cn(
              "grid size-8 place-items-center rounded-full text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              index === page ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {index + 1}
          </button>
        ))}
        <PagerButton label="Next page" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)} icon="chevron_right" />
      </div>
    </div>
  );
}

function PagerButton({ label, disabled, onClick, icon }: { label: string; disabled: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:text-neutral-300"
    >
      <MaterialIcon name={icon} className="text-[20px]" />
    </button>
  );
}

function ProductThumb({ item }: { item?: MockOrder["items"][number] }) {
  if (!item) return <span className="size-10 shrink-0 rounded-xl bg-neutral-100" />;
  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
      <Image src={item.imageSrc} alt="" fill sizes="40px" className="object-cover" />
    </span>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading orders">
      <div className="h-14 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
    </div>
  );
}

function withLane(params: URLSearchParams, enabled: boolean) {
  const search = new URLSearchParams(params.toString());
  search.delete("status");
  if (enabled) search.set("lane", "transit");
  else search.delete("lane");
  const next = search.toString();
  return next ? `/admin/orders?${next}` : "/admin/orders";
}

function inDateWindow(order: MockOrder, filter: { todayOnly: boolean; from: string; to: string }) {
  if (filter.todayOnly) return isSameLocalDay(order.createdAt);
  const time = new Date(order.createdAt).getTime();
  const start = dayStamp(filter.from);
  const end = dayStamp(filter.to);
  if (start != null && end != null && start > end) return time >= end && time < start + 86_400_000;
  if (start != null && time < start) return false;
  if (end != null && time >= end + 86_400_000) return false;
  return true;
}

function inAmountWindow(order: MockOrder, minAmount: string, maxAmount: string) {
  const total = orderGrandTotal(order);
  const min = minAmount ? Number(minAmount) : null;
  const max = maxAmount ? Number(maxAmount) : null;
  if (min != null && Number.isFinite(min) && total < min) return false;
  if (max != null && Number.isFinite(max) && total > max) return false;
  return true;
}

function dayStamp(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
}

function compareOrders(a: MockOrder, b: MockOrder, sort: SortId) {
  if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
  if (sort === "high") return orderGrandTotal(b) - orderGrandTotal(a);
  if (sort === "low") return orderGrandTotal(a) - orderGrandTotal(b);
  return b.createdAt.localeCompare(a.createdAt);
}

function itemSummary(order: MockOrder) {
  const item = order.items[0];
  if (!item) return "No products";
  const extra = order.items.length - 1;
  return extra > 0 ? `${item.title} +${extra}` : item.title;
}

function itemMeta(order: MockOrder) {
  const qty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  if (order.items.length > 1) return `${order.items.length} products · ${qty} pcs`;
  return `${qty} pcs`;
}

function formatOrderWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <OrdersView />
    </Suspense>
  );
}
