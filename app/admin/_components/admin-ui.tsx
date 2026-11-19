import type { AnyPaymentMethod } from "@/lib/admin/orders-desk";
import { PAYMENT_METHOD_LABEL } from "@/lib/admin/orders-desk";
import { cn } from "@/lib/utils";
import type { OrderStatus, StockStatus } from "@/lib/mart-mock/store";

export const ADMIN_ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  new: "New",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  processing: "Processing",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const ADMIN_STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  available: "In stock",
  "sold-out": "Sold out",
  "coming-soon": "Coming soon",
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
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
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
        "rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-indigo-50 text-indigo-700 ring-indigo-200/60",
  pending: "bg-amber-50 text-amber-700 ring-amber-200/60",
  confirmed: "bg-sky-50 text-sky-700 ring-sky-200/60",
  packed: "bg-violet-50 text-violet-700 ring-violet-200/60",
  shipped: "bg-blue-50 text-blue-700 ring-blue-200/60",
  processing: "bg-amber-50 text-amber-700 ring-amber-200/60",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200/60",
  returned: "bg-slate-100 text-slate-700 ring-slate-200/60",
};

export const ORDER_STATUS_MARK: Record<OrderStatus, string> = {
  new: "bg-indigo-600",
  pending: "bg-amber-500",
  confirmed: "bg-sky-600",
  packed: "bg-violet-600",
  shipped: "bg-blue-600",
  processing: "bg-amber-500",
  delivered: "bg-emerald-600",
  cancelled: "bg-rose-500",
  returned: "bg-slate-400",
};

export const adminCardClass =
  "rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]";

export const adminButtonClass = {
  primary:
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none",
  secondary:
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:shadow-none",
  quiet:
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
} as const;

export const STOCK_STATUS_TONE: Record<StockStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  "sold-out": "bg-rose-50 text-rose-700 ring-rose-200/60",
  "coming-soon": "bg-slate-100 text-slate-700 ring-slate-200/60",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
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
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        STOCK_STATUS_TONE[status],
      )}
    >
      {ADMIN_STOCK_STATUS_LABEL[status]}
    </span>
  );
}

export const adminFieldClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-100";

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
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
    >
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[11px] font-medium text-rose-600">{message}</p>;
}

export function AdminLoading() {
  return (
    <div
      className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
      aria-busy="true"
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
    </div>
  );
}

export function AdminEmpty({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      {detail ? (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{detail}</p>
      ) : null}
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
        "rounded-xl px-4 py-3 text-sm font-medium ring-1 ring-inset",
        tone === "warning"
          ? "bg-amber-50 text-amber-900 ring-amber-200"
          : "bg-emerald-50 text-emerald-800 ring-emerald-200",
      )}
    >
      {children}
    </p>
  );
}

export function VisibilityBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
          : "bg-slate-100 text-slate-600 ring-slate-200/60",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function ActiveStatusField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {checked ? "Active" : "Inactive"}
        </span>
        <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
          {checked ? "Visible on the storefront" : "Hidden from the storefront"}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? "Active" : "Inactive"}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          checked ? "bg-indigo-600" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
            checked ? "left-4.5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function PaymentBadge({
  collected = false,
  method = "cod",
}: {
  collected?: boolean;
  method?: AnyPaymentMethod;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        collected
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
          : "bg-slate-100 text-slate-600 ring-slate-200/60",
      )}
    >
      {collected ? "Collected" : PAYMENT_METHOD_LABEL[method]}
    </span>
  );
}