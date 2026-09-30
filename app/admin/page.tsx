"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { useOrders } from "@/lib/mart-mock/hooks";
import {
  formatTaka,
  isSameLocalDay,
  ORDER_STATUSES,
  orderGrandTotal,
  type MockOrder,
  type OrderStatus,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_ORDER_STATUS_LABEL,
  OrderStatusBadge,
} from "./_components/admin-ui";

const RECENT_PAGE_SIZE = 6;

export default function AdminDashboardPage() {
  const orders = useOrders();
  const [recentPage, setRecentPage] = useState(0);

  if (!orders) return <DashboardSkeleton />;

  const sorted = [...orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const recentPageCount = Math.max(
    1,
    Math.ceil(sorted.length / RECENT_PAGE_SIZE),
  );
  const recentIndex = Math.min(recentPage, recentPageCount - 1);
  const recentOrders = sorted.slice(
    recentIndex * RECENT_PAGE_SIZE,
    recentIndex * RECENT_PAGE_SIZE + RECENT_PAGE_SIZE,
  );
  const waiting = sorted.filter((order) => order.status === "new");
  const todayNew = waiting.filter((order) => isSameLocalDay(order.createdAt));
  const onTheWay = sorted.filter(
    (order) => order.status === "confirmed" || order.status === "shipped",
  );
  const todaySales = sorted
    .filter(
      (order) =>
        isSameLocalDay(order.createdAt) &&
        order.status !== "cancelled" &&
        order.status !== "returned",
    )
    .reduce((sum, order) => sum + orderGrandTotal(order), 0);
  const counts = {
    new: waiting.length,
    confirmed: sorted.filter((order) => order.status === "confirmed").length,
    shipped: sorted.filter((order) => order.status === "shipped").length,
    delivered: sorted.filter((order) => order.status === "delivered").length,
    cancelled: sorted.filter((order) => order.status === "cancelled").length,
    returned: sorted.filter((order) => order.status === "returned").length,
  } satisfies Record<OrderStatus, number>;

  return (
    <div className="min-w-0 space-y-3">
      <section>
        <p className="mb-2 text-right text-xs text-neutral-500">
          {formatDashboardDate()}
        </p>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <MetricCard
            href="/admin/orders?status=new"
            label="To confirm"
            value={String(waiting.length)}
            hint={waiting.length > 0 ? "Waiting on you" : "You’re caught up"}
            icon="pending_actions"
            tone={waiting.length > 0 ? "amber" : "neutral"}
          />
          <MetricCard
            href="/admin/orders?status=new&day=today"
            label="Arrived today"
            value={String(todayNew.length)}
            hint="New orders from today"
            icon="inbox"
            tone="teal"
          />
          <MetricCard
            href="/admin/orders?day=today"
            label="Today’s sales"
            value={formatTaka(todaySales)}
            hint="Cancelled and returned left out"
            icon="payments"
            tone="emerald"
          />
          <MetricCard
            href="/admin/orders?lane=transit"
            label="In transit"
            value={String(onTheWay.length)}
            hint={`${counts.confirmed} confirmed, ${counts.shipped} shipped`}
            icon="local_shipping"
            tone="sky"
          />
        </div>
      </section>

      <nav
        aria-label="Order status"
        className="flex min-w-0 gap-1.5 overflow-x-auto"
      >
        {ORDER_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-neutral-200/90 transition-colors hover:bg-neutral-50 hover:ring-neutral-300",
              status === "new" && counts.new > 0 && "ring-amber-300",
            )}
          >
            <span className="text-neutral-700">
              {ADMIN_ORDER_STATUS_LABEL[status]}
            </span>
            <span className="font-semibold tabular-nums text-neutral-950">
              {counts[status]}
            </span>
          </Link>
        ))}
      </nav>

      <section
        className={cn(
          "overflow-hidden rounded-2xl bg-white ring-1",
          waiting.length > 0 ? "ring-amber-200" : "ring-neutral-200/90",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-neutral-950">To confirm</h2>
          {waiting.length > 0 ? (
            <Link
              href="/admin/orders?status=new"
              className="text-sm font-medium text-primary"
            >
              All new
            </Link>
          ) : null}
        </div>
        {waiting.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            Nothing to confirm.
          </p>
        ) : (
          <ul>
            {waiting.slice(0, 4).map((order) => (
              <li key={order.number} className="border-t border-neutral-100">
                <WaitingRow
                  order={order}
                  fresh={isSameLocalDay(order.createdAt)}
                />
              </li>
            ))}
          </ul>
        )}
        {waiting.length > 4 ? (
          <div className="border-t border-neutral-100 px-4 py-2">
            <Link
              href="/admin/orders?status=new"
              className="text-sm font-medium text-primary"
            >
              See the other {waiting.length - 4}
            </Link>
          </div>
        ) : null}
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-neutral-950">Recent</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-primary"
          >
            All orders
          </Link>
        </div>
        {sorted.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-neutral-500">
            No orders yet.
          </p>
        ) : (
          <>
            <ul className="flex flex-col lg:hidden">
              {recentOrders.map((order) => (
                <li
                  key={order.number}
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  <OrderSummary order={order} />
                </li>
              ))}
            </ul>
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7f8fa] text-xs text-neutral-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Order</th>
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-4 py-2 font-medium">Phone</th>
                    <th className="px-4 py-2 font-medium">Total</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <OrderTableRow key={order.number} order={order} />
                  ))}
                </tbody>
              </table>
            </div>
            <RecentPager
              page={recentIndex}
              pageCount={recentPageCount}
              total={sorted.length}
              onPage={setRecentPage}
            />
          </>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-950">
          Shortcuts
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Shortcut
            href="/admin/products"
            icon="inventory_2"
            title="Products"
          />
          <Shortcut
            href="/admin/home/hero"
            icon="view_carousel"
            title="Home hero"
          />
          <Shortcut href="/admin/pages/about" icon="domain" title="Pages" />
          <Shortcut
            href="/admin/site/header"
            icon="web"
            title="Header and footer"
          />
          <Shortcut
            href="/admin/delivery"
            icon="local_shipping"
            title="Delivery"
          />
        </div>
      </section>
    </div>
  );
}

function WaitingRow({ order, fresh }: { order: MockOrder; fresh: boolean }) {
  const item = order.items[0];
  return (
    <Link
      href={`/admin/orders/${order.number}`}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2.5 transition-colors hover:bg-amber-50/70 lg:grid-cols-[auto_8.5rem_minmax(8rem,0.8fr)_minmax(0,1.4fr)_6rem_auto] lg:gap-x-4"
    >
      <ProductThumb item={item} />
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-950">
            {order.number}
          </span>
          {fresh ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Today
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-neutral-500 lg:hidden">
          {order.customerName} · {formatTaka(orderGrandTotal(order))}
        </span>
      </span>
      <span className="hidden truncate text-sm text-neutral-800 lg:block">
        {order.customerName}
      </span>
      <span className="hidden truncate text-sm text-neutral-500 lg:block">
        {item ? item.title : "—"}
      </span>
      <span className="hidden text-right text-sm font-semibold tabular-nums text-neutral-950 lg:block">
        {formatTaka(orderGrandTotal(order))}
      </span>
      <span className="inline-flex h-8 justify-self-end items-center rounded-full bg-neutral-950 px-3 text-xs font-medium text-white">
        Open
      </span>
    </Link>
  );
}

function MetricCard({
  href,
  label,
  value,
  hint,
  icon,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: "teal" | "amber" | "emerald" | "sky" | "neutral";
}) {
  const toneClass = {
    teal: "bg-primary/10 text-primary",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    neutral: "bg-neutral-100 text-neutral-600",
  }[tone];

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl bg-white px-3.5 py-3.5 ring-1 ring-neutral-200/90 transition duration-150 hover:-translate-y-px hover:shadow-[0_10px_24px_-18px_rgba(15,23,42,0.45)] hover:ring-neutral-300"
    >
      <span className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            toneClass,
          )}
        >
          <MaterialIcon name={icon} className="text-[18px]" />
        </span>
        <MaterialIcon
          name="arrow_outward"
          className="text-[18px] text-neutral-300 transition group-hover:text-primary"
        />
      </span>
      <span className="mt-3 text-sm text-neutral-600">{label}</span>
      <span className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-neutral-950">
        {value}
      </span>
      <span className="mt-1 text-xs leading-4 text-neutral-500">{hint}</span>
    </Link>
  );
}

function Shortcut({
  href,
  icon,
  title,
}: {
  href: string;
  icon: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-neutral-200/90 transition-colors hover:bg-neutral-50 hover:ring-neutral-300"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f7f8fa] text-neutral-700">
        <MaterialIcon name={icon} className="text-[18px]" />
      </span>
      <span className="min-w-0 text-sm font-semibold text-neutral-950">
        {title}
      </span>
    </Link>
  );
}

function OrderSummary({ order }: { order: MockOrder }) {
  const item = order.items[0];
  return (
    <Link
      href={`/admin/orders/${order.number}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50"
    >
      <ProductThumb item={item} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-neutral-950">
            {order.number}
          </span>
          <OrderStatusBadge status={order.status} />
        </span>
        <span className="mt-0.5 block truncate text-sm text-neutral-700">
          {order.customerName}
        </span>
        <span className="mt-0.5 block text-sm font-semibold tabular-nums text-neutral-950">
          {formatTaka(orderGrandTotal(order))}
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
      className="group cursor-pointer border-t border-neutral-100 transition-colors hover:bg-neutral-50"
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(href);
      }}
      tabIndex={0}
    >
      <td className="px-4 py-2.5">
        <span className="flex items-center gap-3">
          <ProductThumb item={item} />
          <span className="min-w-0">
            <span className="block font-semibold text-neutral-950">
              {order.number}
            </span>
            <span className="block max-w-56 truncate text-xs text-neutral-500">
              {item ? item.title : "—"}
            </span>
          </span>
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className="block text-neutral-800">{order.customerName}</span>
        <span className="block text-xs text-neutral-500">
          {formatOrderWhen(order.createdAt)}
        </span>
      </td>
      <td className="px-4 py-2.5 tabular-nums text-neutral-600">
        {order.phone}
      </td>
      <td className="px-4 py-2.5 font-medium tabular-nums">
        {formatTaka(orderGrandTotal(order))}
      </td>
      <td className="px-4 py-2.5">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="px-3 py-2.5 text-neutral-300 group-hover:text-primary">
        <MaterialIcon name="chevron_right" className="text-[20px]" />
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

function RecentPager({
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
  if (total <= RECENT_PAGE_SIZE) return null;
  const start = page * RECENT_PAGE_SIZE + 1;
  const end = Math.min(total, (page + 1) * RECENT_PAGE_SIZE);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2">
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

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90"
          />
        ))}
      </div>
      <div className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      <div className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
    </div>
  );
}

function formatDashboardDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatOrderWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const start = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((start(now) - start(date)) / 86_400_000);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  if (days <= 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}
