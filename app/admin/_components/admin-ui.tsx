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
  new: "bg-primary/10 text-[#0b3d39]",
  confirmed: "bg-sky-50 text-sky-800",
  shipped: "bg-amber-50 text-amber-900",
  delivered: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-red-50 text-red-700",
  returned: "bg-neutral-100 text-neutral-700",
};

export const ORDER_STATUS_MARK: Record<OrderStatus, string> = {
  new: "bg-primary",
  confirmed: "bg-sky-600",
  shipped: "bg-amber-500",
  delivered: "bg-emerald-600",
  cancelled: "bg-red-500",
  returned: "bg-neutral-400",
};

export const adminCardClass = "rounded-2xl bg-admin-surface ring-1 ring-neutral-200/90";
export const adminButtonClass = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:bg-neutral-100 disabled:text-neutral-400",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:text-neutral-400",
  quiet:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
} as const;

export const STOCK_STATUS_TONE: Record<StockStatus, string> = {
  available: "bg-emerald-50 text-emerald-800",
  "sold-out": "bg-red-50 text-red-700",
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
  "h-11 w-full rounded-xl border border-neutral-200 bg-[#f5f6f8] px-3.5 text-sm text-neutral-950 shadow-none outline-none placeholder:text-neutral-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30";

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
    <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" />
  );
}

export function AdminEmpty({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="px-5 py-16 text-center">
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      {detail ? <p className="mt-1 text-sm text-neutral-500">{detail}</p> : null}
    </div>
  );
}

export function AdminNotice({
  tone,
  children,
}: {
  tone: "warning" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1",
        tone === "warning"
          ? "bg-amber-50 text-amber-950 ring-amber-200"
          : "bg-emerald-50 text-emerald-900 ring-emerald-200",
      )}
    >
      {children}
    </p>
  );
}

export function PaymentBadge({ collected = false }: { collected?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        collected ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-700",
      )}
    >
      {collected ? "Collected" : "Cash on delivery"}
    </span>
  );
}
