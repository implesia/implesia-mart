import { cn } from "@/lib/utils";
import type { OrderStatus, StockStatus } from "@/lib/mart-mock/store";
import type { ProductCategoryId } from "@/app/(client)/_data/products/products";

export const ADMIN_ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const ADMIN_STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  available: "In stock",
  "sold-out": "Sold out",
  "coming-soon": "Coming soon",
};

export const ADMIN_CATEGORY_LABEL: Record<ProductCategoryId, string> = {
  gadgets: "Trending gadgets",
  fashion: "Gorgeous dresses",
};

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-primary/10 text-primary",
  confirmed: "bg-sky-50 text-sky-700",
  shipped: "bg-amber-50 text-amber-800",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
  returned: "bg-neutral-100 text-neutral-700",
};

export const STOCK_STATUS_TONE: Record<StockStatus, string> = {
  available: "bg-emerald-50 text-emerald-700",
  "sold-out": "bg-red-50 text-red-600",
  "coming-soon": "bg-neutral-100 text-neutral-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        ORDER_STATUS_TONE[status],
      )}
    >
      {ADMIN_ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        STOCK_STATUS_TONE[status],
      )}
    >
      {ADMIN_STOCK_STATUS_LABEL[status]}
    </span>
  );
}

export const adminFieldClass =
  "h-11 w-full rounded-xl border border-neutral-200 bg-[#f5f6f8] px-3.5 text-sm text-neutral-950 shadow-none outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30";

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-neutral-700"
    >
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>;
}

export function AdminLoading() {
  return (
    <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
  );
}
