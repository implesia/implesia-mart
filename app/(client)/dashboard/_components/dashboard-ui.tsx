import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { MaterialIcon } from "../../_components/common/material-icon";

export function DashboardCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#131c1b] sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

const KPI_TONES = {
  neutral: {
    card: "border-neutral-200/90 bg-white dark:border-white/10 dark:bg-[#131c1b]",
    icon: "bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200",
    value: "text-neutral-950 dark:text-white",
  },
  sky: {
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50/50 to-white dark:border-sky-900/40 dark:from-sky-950/30 dark:to-[#131c1b]",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
    value: "text-sky-950 dark:text-sky-100",
  },
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-[#131c1b]",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
    value: "text-emerald-950 dark:text-emerald-100",
  },
  amber: {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white dark:border-amber-900/40 dark:from-amber-950/25 dark:to-[#131c1b]",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
    value: "text-amber-950 dark:text-amber-100",
  },
  teal: {
    card: "border-[#2bc0b5]/30 bg-gradient-to-br from-[#d6f7f5]/45 to-white dark:border-[#3dd4c8]/25 dark:from-[#0b5e56]/25 dark:to-[#131c1b]",
    icon: "bg-[#d6f7f5] text-[#0b5e56] dark:bg-[#0b5e56]/50 dark:text-[#3dd4c8]",
    value: "text-neutral-950 dark:text-white",
  },
} as const;

export function DashboardKpiCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  loading = false,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
  tone?: keyof typeof KPI_TONES;
  loading?: boolean;
}) {
  const styles = KPI_TONES[tone];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-sm sm:p-5",
        styles.card,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          {label}
        </span>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-xl",
            styles.icon,
          )}
        >
          <MaterialIcon name={icon} className="text-[19px]" />
        </span>
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-200/70 dark:bg-white/10" />
        ) : (
          <p
            className={cn(
              "text-2xl font-extrabold tracking-tight tabular-nums sm:text-[26px]",
              styles.value,
            )}
          >
            {value}
          </p>
        )}
        <p className="mt-1 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
          {hint}
        </p>
      </div>
    </div>
  );
}

const ORDER_STATUS_META: Record<string, { label: string; className: string }> =
  {
    new: {
      label: "নতুন অর্ডার",
      className:
        "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-950/50 dark:text-indigo-300",
    },
    confirmed: {
      label: "কনফার্মড",
      className:
        "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-300",
    },
    packed: {
      label: "প্যাকিং সম্পন্ন",
      className:
        "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/50 dark:text-violet-300",
    },
    shipped: {
      label: "ডেলিভারির পথে",
      className:
        "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/50 dark:text-blue-300",
    },
    delivered: {
      label: "ডেলিভার্ড",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
    cancelled: {
      label: "বাতিল",
      className:
        "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300",
    },
    returned: {
      label: "রিটার্নড",
      className:
        "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300",
    },
  };

export function DashboardOrderStatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS_META[status.toLowerCase()] ?? {
    label: status,
    className:
      "bg-neutral-100 text-neutral-700 ring-neutral-400/20 dark:bg-white/10 dark:text-neutral-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function formatBanglaDate(iso: string, withTime = false): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    });
  } catch {
    return iso;
  }
}
