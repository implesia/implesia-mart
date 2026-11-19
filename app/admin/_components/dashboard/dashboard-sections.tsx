import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ShoppingBag,
  MapPin,
  PieChart,
  Inbox,
  Package,
  TrendingUp,
} from "lucide-react";

import type {
  DashboardArea,
  DashboardCategory,
  DashboardRecentOrder,
  DashboardSeller,
  DashboardStatusSlice,
} from "@/lib/mart-api/dashboard";
import { formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_ORDER_STATUS_LABEL,
  ORDER_STATUS_MARK,
  OrderStatusBadge,
} from "../admin-ui";

export function OrderActivity({
  statuses,
  total,
}: {
  statuses: DashboardStatusSlice[];
  total: number;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
        <SectionHeading
          title="Order activity"
          description="How orders in this period are moving."
          href="/admin/orders/list"
          action="All orders"
          icon={TrendingUp}
        />
      </div>

      <div className="p-4 sm:p-5">
        {total === 0 ? (
          <EmptyCopy icon={Inbox}>No order data available for this period.</EmptyCopy>
        ) : (
          <>
            {/* Segmented Progress Bar */}
            <div
              className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner"
              aria-hidden
            >
              {statuses.map((slice) =>
                slice.count === 0 ? null : (
                  <span
                    key={slice.status}
                    className={cn("transition-all duration-500", ORDER_STATUS_MARK[slice.status])}
                    style={{ width: `${slice.share}%` }}
                  />
                ),
              )}
            </div>

            {/* Status List */}
            <ul className="mt-5 grid gap-1.5 sm:grid-cols-2">
              {statuses.map((slice) => (
                <li key={slice.status}>
                  <Link
                    href={`/admin/orders/list?status=${slice.status}`}
                    className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full ring-2 ring-white shadow-sm",
                        ORDER_STATUS_MARK[slice.status],
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                      {ADMIN_ORDER_STATUS_LABEL[slice.status]}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {slice.count}
                    </span>
                    <span className="w-12 text-right text-[11px] font-semibold tabular-nums text-slate-400 group-hover:text-slate-600">
                      {slice.share}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

export function BestSellingProducts({
  products,
}: {
  products: DashboardSeller[];
}) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
        <SectionHeading
          title="Best selling products"
          description="Product revenue in this period, excluding cancelled and returned orders."
          href="/admin/products"
          action="View all products"
          icon={Package}
        />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <EmptyCopy icon={ShoppingBag}>No product sales in this period.</EmptyCopy>
        </div>
      ) : (
        <ol className="flex-1 divide-y divide-slate-100">
          {products.map((product, index) => (
            <li key={product.productId ?? product.slug}>
              <Link
                href={
                  product.productId
                    ? `/admin/products/${product.productId}`
                    : "/admin/products"
                }
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:px-5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                  {index + 1}
                </span>
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {product.imageSrc ? (
                    <Image
                      src={product.imageSrc}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900 group-hover:text-indigo-600">
                    {product.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                    {product.category} · {product.stockLabel}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-slate-900">
                    {formatTaka(product.revenue)}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium tabular-nums text-slate-500">
                    {product.units} sold
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function RecentOrders({ orders }: { orders: DashboardRecentOrder[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
        <SectionHeading
          title="Recent orders"
          description="Latest orders placed in this period."
          href="/admin/orders/list"
          action="View all orders"
          icon={Inbox}
        />
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center p-10">
          <EmptyCopy icon={Inbox}>No order data available for this period.</EmptyCopy>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <ul className="divide-y divide-slate-100 lg:hidden">
            {orders.map((order) => (
              <li key={order.number}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <th className="px-4 py-2.5 font-semibold">Customer</th>
                  <th className="px-4 py-2.5 font-semibold">Items</th>
                  <th className="px-4 py-2.5 font-semibold">Amount</th>
                  <th className="px-4 py-2.5 font-semibold">Placed</th>
                  <th className="px-4 py-2.5 font-semibold">Payment</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.number} className="group transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link href={`/admin/orders/${order.id}`} className="transition-colors group-hover:text-indigo-600">
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {order.customerName}
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-3 text-slate-500">
                      {order.itemsLabel}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                      {formatTaka(order.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatWhen(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge />
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export function OrderAreas({ areas }: { areas: DashboardArea[] }) {
  const peak = Math.max(1, ...areas.map((area) => area.orders));
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
        <SectionHeading
          title="Order areas"
          description="Districts parsed from delivery addresses. Revenue leaves out cancelled and returned orders."
          icon={MapPin}
        />
      </div>
      {areas.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <EmptyCopy icon={MapPin}>No order data available for this period.</EmptyCopy>
        </div>
      ) : (
        <ul className="flex-1 space-y-4 p-4 sm:p-5">
          {areas.map((area) => (
            <li key={area.name}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">
                  {area.name}
                </p>
                <p className="text-xs font-semibold tabular-nums text-slate-600">
                  {area.share}%
                  <span className="ml-2 font-medium text-slate-400">
                    {area.orders} {area.orders === 1 ? "order" : "orders"} · {formatTaka(area.revenue)}
                  </span>
                </p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                <span
                  className="block h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${(area.orders / peak) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SalesInsights({ categories }: { categories: DashboardCategory[] }) {
  if (categories.length === 0) return null;
  const peak = Math.max(1, ...categories.map((category) => category.revenue));
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
        <SectionHeading
          title="Sales by category"
          description="Product revenue split across the catalog."
          icon={PieChart}
        />
      </div>
      <ul className="flex-1 space-y-4 p-4 sm:p-5">
        {categories.map((category) => (
          <li key={category.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-slate-900">
                {category.label}
              </p>
              <p className="text-xs font-semibold tabular-nums text-slate-600">
                {formatTaka(category.revenue)}
                <span className="ml-2 font-medium text-slate-400">
                  {category.share}% · {category.units} sold
                </span>
              </p>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
              <span
                className="block h-full rounded-full bg-slate-900 transition-all duration-500"
                style={{ width: `${(category.revenue / peak) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrderCard({ order }: { order: DashboardRecentOrder }) {
  return (
    <Link href={`/admin/orders/${order.id}`} className="group block p-4 transition-colors hover:bg-slate-50 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
          {order.number}
        </span>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 truncate text-sm font-medium text-slate-700">{order.customerName}</p>
      <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{order.itemsLabel}</p>
      <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
        <span className="text-sm font-bold tabular-nums text-slate-900">{formatTaka(order.total)}</span>
        <span className="text-[11px] font-medium text-slate-500">
          {formatWhen(order.createdAt)} · COD
        </span>
      </div>
    </Link>
  );
}

function PaymentBadge() {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/60">
      Cash on delivery
    </span>
  );
}

function SectionHeading({
  title,
  description,
  href,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/60">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
            {description}
          </p>
        </div>
      </div>
      {href && action ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
        >
          {action}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyCopy({
  children,
  icon: Icon,
}: {
  children: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{children}</p>
    </div>
  );
}

function formatWhen(iso: string) {
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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}