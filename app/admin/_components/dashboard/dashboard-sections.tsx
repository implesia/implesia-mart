import Image from "next/image";
import Link from "next/link";

import type {
  DashboardArea,
  DashboardCategory,
  DashboardSeller,
  DashboardStatusSlice,
} from "@/lib/mart-mock/dashboard";
import { formatTaka, orderGrandTotal, type MockOrder, type OrderStatus } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { ADMIN_ORDER_STATUS_LABEL, OrderStatusBadge } from "../admin-ui";

const STATUS_BAR: Record<OrderStatus, string> = {
  new: "bg-primary",
  confirmed: "bg-sky-600",
  shipped: "bg-amber-500",
  delivered: "bg-emerald-600",
  cancelled: "bg-red-500",
  returned: "bg-neutral-400",
};

export function OrderActivity({
  statuses,
  total,
}: {
  statuses: DashboardStatusSlice[];
  total: number;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      <SectionHeading
        title="Order activity"
        description="How orders in this period are moving."
        href="/admin/orders"
        action="All orders"
      />
      {total === 0 ? (
        <EmptyCopy>No order data available for this period.</EmptyCopy>
      ) : (
        <>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
            {statuses.map((slice) =>
              slice.count === 0 ? null : (
                <span
                  key={slice.status}
                  className={STATUS_BAR[slice.status]}
                  style={{ width: `${slice.share}%` }}
                />
              ),
            )}
          </div>
          <ul className="mt-4 grid gap-1 sm:grid-cols-2">
            {statuses.map((slice) => (
              <li key={slice.status}>
                <Link
                  href={`/admin/orders?status=${slice.status}`}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", STATUS_BAR[slice.status])} aria-hidden />
                  <span className="min-w-0 flex-1 text-sm text-neutral-700">
                    {ADMIN_ORDER_STATUS_LABEL[slice.status]}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-neutral-950">{slice.count}</span>
                  <span className="w-12 text-right text-xs tabular-nums text-neutral-500">
                    {slice.share}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function BestSellingProducts({ products }: { products: DashboardSeller[] }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      <SectionHeading
        title="Best selling products"
        description="Product revenue in this period, excluding cancelled and returned orders."
        href="/admin/products"
        action="View all products"
      />
      {products.length === 0 ? (
        <EmptyCopy>No product sales in this period.</EmptyCopy>
      ) : (
        <ol className="mt-3">
          {products.map((product, index) => (
            <li key={product.slug} className="border-t border-neutral-100 first:border-t-0">
              <Link
                href={`/admin/products/${product.slug}`}
                className="flex items-center gap-3 py-2.5 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-neutral-400">
                  {index + 1}
                </span>
                <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <Image src={product.imageSrc} alt="" fill sizes="44px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-950">{product.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-neutral-500">
                    {product.category} · {product.stockLabel}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-neutral-950">
                    {formatTaka(product.revenue)}
                  </span>
                  <span className="mt-0.5 block text-xs tabular-nums text-neutral-500">
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

export function RecentOrders({ orders }: { orders: MockOrder[] }) {
  return (
    <section className="min-w-0 rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <SectionHeading
          title="Recent orders"
          description="Latest orders placed in this period."
          href="/admin/orders"
          action="View all orders"
        />
      </div>
      {orders.length === 0 ? (
        <EmptyCopy>No order data available for this period.</EmptyCopy>
      ) : (
        <>
          <ul className="mt-3 border-t border-neutral-100 lg:hidden">
            {orders.map((order) => (
              <li key={order.number} className="border-b border-neutral-100 last:border-b-0">
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
          <div className="mt-3 hidden overflow-x-auto border-t border-neutral-100 lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f7f8fa] text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Order</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Items</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Placed</th>
                  <th className="px-4 py-2 font-medium">Payment</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.number} className="border-t border-neutral-100">
                    <td className="px-4 py-2.5 font-semibold">
                      <Link href={`/admin/orders/${order.number}`} className="hover:text-primary">
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-800">{order.customerName}</td>
                    <td className="max-w-56 truncate px-4 py-2.5 text-neutral-600">{itemLabel(order)}</td>
                    <td className="px-4 py-2.5 font-medium tabular-nums">{formatTaka(orderGrandTotal(order))}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{formatWhen(order.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <PaymentBadge />
                    </td>
                    <td className="px-4 py-2.5">
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
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      <SectionHeading
        title="Order areas"
        description="Districts parsed from delivery addresses. Revenue leaves out cancelled and returned orders."
      />
      {areas.length === 0 ? (
        <EmptyCopy>No order data available for this period.</EmptyCopy>
      ) : (
        <ul className="mt-4 space-y-3">
          {areas.map((area) => (
            <li key={area.name}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-950">{area.name}</p>
                <p className="text-sm tabular-nums text-neutral-700">
                  {area.share}%
                  <span className="ml-2 text-xs text-neutral-500">
                    {area.orders} {area.orders === 1 ? "order" : "orders"} · {formatTaka(area.revenue)}
                  </span>
                </p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
                <span
                  className="block h-full rounded-full bg-primary"
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
    <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
      <SectionHeading
        title="Sales by category"
        description="Product revenue split across the catalog."
      />
      <ul className="mt-4 space-y-3">
        {categories.map((category) => (
          <li key={category.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-950">{category.label}</p>
              <p className="text-sm tabular-nums text-neutral-700">
                {formatTaka(category.revenue)}
                <span className="ml-2 text-xs text-neutral-500">
                  {category.share}% · {category.units} sold
                </span>
              </p>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
              <span
                className="block h-full rounded-full bg-neutral-950"
                style={{ width: `${(category.revenue / peak) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrderCard({ order }: { order: MockOrder }) {
  return (
    <Link href={`/admin/orders/${order.number}`} className="block px-4 py-3 hover:bg-neutral-50 sm:px-5">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-neutral-950">{order.number}</span>
        <OrderStatusBadge status={order.status} />
      </span>
      <span className="mt-1 block truncate text-sm text-neutral-700">{order.customerName}</span>
      <span className="mt-0.5 block truncate text-xs text-neutral-500">{itemLabel(order)}</span>
      <span className="mt-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold tabular-nums text-neutral-950">{formatTaka(orderGrandTotal(order))}</span>
        <span className="text-xs text-neutral-500">{formatWhen(order.createdAt)} · Cash on delivery</span>
      </span>
    </Link>
  );
}

function PaymentBadge() {
  return (
    <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
      Cash on delivery
    </span>
  );
}

function SectionHeading({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
        <p className="mt-0.5 text-xs leading-5 text-neutral-500">{description}</p>
      </div>
      {href && action ? (
        <Link href={href} className="shrink-0 text-sm font-medium text-primary">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyCopy({ children }: { children: string }) {
  return <p className="px-1 py-10 text-center text-sm text-neutral-500">{children}</p>;
}

function itemLabel(order: MockOrder) {
  const first = order.items[0];
  if (!first) return "—";
  const extra = order.items.length - 1;
  return extra > 0 ? `${first.title} +${extra}` : first.title;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((start(now) - start(date)) / 86_400_000);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  if (days <= 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}
