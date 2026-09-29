"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { useOrders } from "@/lib/mart-mock/hooks";
import {
  formatTaka,
  isSameLocalDay,
  orderGrandTotal,
  type MockOrder,
  type OrderStatus,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { ADMIN_ORDER_STATUS_LABEL, OrderStatusBadge } from "./_components/admin-ui";

const FLOW = ["new", "confirmed", "shipped", "delivered"] as const;
const SIDE = ["cancelled", "returned"] as const;

const FLOW_HINT: Record<(typeof FLOW)[number], string> = {
  new: "Needs confirmation",
  confirmed: "Hand to courier",
  shipped: "On the way",
  delivered: "Delivered",
};

export default function AdminDashboardPage() {
  const orders = useOrders();

  if (!orders) return <DashboardSkeleton />;

  const sorted = [...orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
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
    <div className="space-y-3">
      <section
        className={cn(
          "overflow-hidden rounded-2xl bg-white ring-1",
          waiting.length > 0 ? "ring-amber-200" : "ring-neutral-200/90",
        )}
      >
        <div className="flex flex-col gap-2 border-b border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl",
                waiting.length > 0
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700",
              )}
            >
              <MaterialIcon
                name={waiting.length > 0 ? "priority_high" : "check_circle"}
                className="text-[22px]"
              />
            </span>
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                {waiting.length > 0
                  ? `${waiting.length} ${waiting.length === 1 ? "order" : "orders"} still unconfirmed`
                  : "Nothing left to confirm"}
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                {waiting.length > 0
                  ? "Open one to change the name, address, and status. Today’s new orders come first."
                  : "New orders show up here."}
              </p>
            </div>
          </div>
          <p className="text-sm text-neutral-500">{formatDashboardDate()}</p>
        </div>
        {waiting.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500">
            No orders in the new status right now.
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MetricCard
          href="/admin/orders?status=new"
          label="Arrived today"
          value={String(todayNew.length)}
          hint="New today, still unconfirmed"
          icon="inbox"
          tone="teal"
        />
        <MetricCard
          href="/admin/orders"
          label="Today’s sales"
          value={formatTaka(todaySales)}
          hint="Cancelled and returned orders excluded"
          icon="payments"
          tone="emerald"
        />
        <MetricCard
          href="/admin/orders"
          label="On the way"
          value={String(onTheWay.length)}
          hint="Confirmed or shipped"
          icon="local_shipping"
          tone="sky"
        />
      </div>

      <section className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200/90 sm:p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">
              How an order moves
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Open a step to see only that status.
            </p>
          </div>
          <div className="flex gap-2">
            {SIDE.map((status) => (
              <Link
                key={status}
                href={`/admin/orders?status=${status}`}
                className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200"
              >
                {ADMIN_ORDER_STATUS_LABEL[status]} {counts[status]}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {FLOW.map((status, index) => (
            <Link
              key={status}
              href={`/admin/orders?status=${status}`}
              className="group rounded-xl bg-[#f7f8fa] px-3 py-2.5 transition-colors hover:bg-primary/10"
            >
              <span className="text-xs text-neutral-500">
                {index + 1}. {FLOW_HINT[status]}
              </span>
              <span className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-neutral-950">
                  {ADMIN_ORDER_STATUS_LABEL[status]}
                </span>
                <span className="text-lg font-semibold tabular-nums text-neutral-950 group-hover:text-primary">
                  {counts[status]}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_16.5rem]">
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2.5">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">
                Latest orders
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Open a row for the full order.
              </p>
            </div>
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
                {sorted.slice(0, 6).map((order) => (
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
                    {sorted.slice(0, 6).map((order) => (
                      <OrderTableRow key={order.number} order={order} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200/90">
          <h2 className="px-2 text-sm font-semibold text-neutral-950">
            Also here
          </h2>
          <p className="mt-0.5 px-2 text-xs text-neutral-500">
            Store, home sections, and site copy.
          </p>
          <div className="mt-1 flex flex-col">
            <Shortcut
              href="/admin/products"
              icon="inventory_2"
              title="Products"
              text="Price, stock, and publishing"
            />
            <Shortcut
              href="/admin/home/hero"
              icon="view_carousel"
              title="Home hero"
              text="Slide copy and images"
            />
            <Shortcut
              href="/admin/pages/about"
              icon="domain"
              title="Page CMS"
              text="About through privacy — each section separate"
            />
            <Shortcut
              href="/admin/site/header"
              icon="web"
              title="Header and footer"
              text="Menu and columns on every page"
            />
            <Shortcut
              href="/admin/delivery"
              icon="local_shipping"
              title="Delivery charges"
              text="Inside and outside Dhaka"
            />
          </div>
        </section>
      </div>
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
          <span className="text-sm font-semibold text-neutral-950">{order.number}</span>
          {fresh ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Today
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
              Earlier
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-neutral-500 lg:hidden">
          {order.customerName} · {formatTaka(orderGrandTotal(order))}
        </span>
      </span>
      <span className="hidden truncate text-sm text-neutral-800 lg:block">{order.customerName}</span>
      <span className="hidden truncate text-sm text-neutral-500 lg:block">{item ? item.title : "—"}</span>
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
  tone: "teal" | "emerald" | "sky";
}) {
  const toneClass = {
    teal: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
  }[tone];

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-neutral-200/90 transition-colors hover:bg-neutral-50 hover:ring-neutral-300"
    >
      <span className="min-w-0">
        <span className="block text-xs text-neutral-500">{label}</span>
        <span className="mt-0.5 block text-2xl font-semibold tracking-tight tabular-nums text-neutral-950">
          {value}
        </span>
        <span className="mt-0.5 block truncate text-xs text-neutral-400 group-hover:text-neutral-600">
          {hint}
        </span>
      </span>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          toneClass,
        )}
      >
        <MaterialIcon name={icon} className="text-[20px]" />
      </span>
    </Link>
  );
}

function Shortcut({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-neutral-50"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f7f8fa] text-neutral-700">
        <MaterialIcon name={icon} className="text-[20px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-neutral-950">
          {title}
        </span>
        <span className="block truncate text-xs text-neutral-500">{text}</span>
      </span>
      <MaterialIcon
        name="chevron_right"
        className="text-[20px] text-neutral-300"
      />
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

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90"
          />
        ))}
      </div>
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
