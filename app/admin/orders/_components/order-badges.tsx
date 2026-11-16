import {
  CALL_STATUS_LABEL,
  DUPLICATE_ORDER_WARNING,
  ORIGIN_LABEL,
  PAYMENT_STATUS_LABEL,
  historyBadge,
  type CallStatus,
  type CustomerHistoryCounts,
  type OrderOrigin,
  type PaymentStatus,
} from "@/lib/admin/orders-desk";
import { cn } from "@/lib/utils";

export function OriginBadge({ origin }: { origin: OrderOrigin }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        origin === "offline" ? "bg-amber-50 text-amber-900" : "bg-neutral-100 text-neutral-700",
      )}
    >
      {ORIGIN_LABEL[origin]}
    </span>
  );
}

export function CallStatusBadge({ status }: { status: CallStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "fake"
          ? "bg-red-50 text-red-700"
          : status === "confirmed"
            ? "bg-emerald-50 text-emerald-800"
            : status === "no_answer"
              ? "bg-amber-50 text-amber-900"
              : "bg-neutral-100 text-neutral-700",
      )}
    >
      {CALL_STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "paid"
          ? "bg-emerald-50 text-emerald-800"
          : status === "partial"
            ? "bg-amber-50 text-amber-900"
            : "bg-neutral-100 text-neutral-700",
      )}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

export function HistoryBadge({ history }: { history: CustomerHistoryCounts }) {
  const badge = historyBadge(history);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        badge.caution ? "bg-amber-50 text-amber-950" : "bg-neutral-100 text-neutral-700",
      )}
    >
      {badge.label}
    </span>
  );
}

export function DuplicateWarning() {
  return (
    <p role="status" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
      {DUPLICATE_ORDER_WARNING}
    </p>
  );
}
