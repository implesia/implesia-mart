"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { ExportExcelButton } from "@/app/admin/inventory/_components/excel-actions";
import { adminButtonClass } from "@/app/admin/_components/admin-ui";
import { REPORT_PAGES, formatReportMoney, formatReportPercent } from "@/lib/admin/reports";
import { downloadReportExport } from "@/lib/mart-api/reports";
import type { ReportExportKind } from "@/lib/mart-mock/reports";
import { cn } from "@/lib/utils";

import { ReportFilterBar, type ReportQueryState } from "./report-filters";

export { REPORT_PAGES };

export function ReportShell({
  title,
  subtitle,
  query,
  exportKind,
  exportLabel = "Export Excel",
  extraActions,
  showOrigin = true,
  showSupplier = true,
  showCategory = true,
  showProduct = true,
  showGrain = false,
  filterNote,
  children,
}: {
  title: string;
  subtitle: string;
  query: ReportQueryState;
  exportKind?: ReportExportKind;
  exportLabel?: string;
  extraActions?: React.ReactNode;
  showOrigin?: boolean;
  showSupplier?: boolean;
  showCategory?: boolean;
  showProduct?: boolean;
  showGrain?: boolean;
  filterNote?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-w-0 space-y-5 pb-10">
      {/* Executive SaaS Header */}
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              {title}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#0b3d39] ring-1 ring-teal-200/70">
              {query.rangeLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {extraActions}
          {exportKind ? (
            <ExportExcelButton
              label={exportLabel}
              filename={query.exportFilename(exportKind)}
              onExport={() => downloadReportExport(exportKind, query.call, query.now)}
            />
          ) : null}
          <button
            type="button"
            onClick={() => window.print()}
            className={adminButtonClass.secondary}
          >
            <MaterialIcon name="print" className="text-[18px]" />
            Print / PDF
          </button>
        </div>
      </header>

      {/* Sub-navigation across the 7 SaaS Report Pages */}
      <nav
        aria-label="Reports suite"
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xs print:hidden"
      >
        {REPORT_PAGES.map((page) => {
          const active = pathname === page.href;
          return (
            <Link
              key={page.href}
              href={query.hrefFor(page.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                active
                  ? "bg-[#0b3d39] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <MaterialIcon name={page.icon} className="text-[16px]" />
              {page.label}
            </Link>
          );
        })}
      </nav>

      {/* Persistent Filter Bar */}
      <ReportFilterBar
        query={query}
        showOrigin={showOrigin}
        showSupplier={showSupplier}
        showCategory={showCategory}
        showProduct={showProduct}
        showGrain={showGrain}
        note={filterNote}
      />

      {query.queryError ? (
        <ReportErrorBanner message={query.queryError} />
      ) : (
        children
      )}
    </div>
  );
}

export function ReportKpiCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  badge,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: "neutral" | "positive" | "negative" | "warning" | "accent";
  badge?: React.ReactNode;
}) {
  const valueTone = {
    neutral: "text-slate-950",
    positive: "text-emerald-700",
    negative: "text-rose-700",
    warning: "text-amber-700",
    accent: "text-[#0b3d39]",
  }[tone];

  const iconTone = {
    neutral: "bg-slate-100 text-slate-600",
    positive: "bg-emerald-50 text-emerald-700",
    negative: "bg-rose-50 text-rose-700",
    warning: "bg-amber-50 text-amber-700",
    accent: "bg-teal-50 text-[#0b3d39]",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", iconTone)}>
          <MaterialIcon name={icon} className="text-[16px]" />
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
        <p className={cn("text-xl font-bold tracking-tight tabular-nums sm:text-2xl", valueTone)}>
          {value}
        </p>
        {badge}
      </div>
      {hint ? <p className="mt-1.5 text-[11px] font-medium text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ReportSectionCard({
  title,
  subtitle,
  action,
  children,
  padded = true,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className={padded ? "p-4 sm:p-5" : undefined}>{children}</div>
    </section>
  );
}

export function ProfitPill({
  profit,
  marginPercent,
  showMargin = false,
}: {
  profit: number | null;
  marginPercent?: number | null;
  showMargin?: boolean;
}) {
  if (profit == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/70">
        Unknown cost
      </span>
    );
  }
  const loss = profit < 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        loss
          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200/70"
          : profit > 0
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70"
            : "bg-slate-100 text-slate-600",
      )}
    >
      {profit > 0 ? `+${formatReportMoney(profit)}` : formatReportMoney(profit)}
      {showMargin && marginPercent != null ? (
        <span className="opacity-80">({formatReportPercent(marginPercent)})</span>
      ) : null}
    </span>
  );
}

export function ReportLoadingSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading report">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4"
          >
            <div className="h-3 w-24 rounded bg-slate-200/80" />
            <div className="mt-4 h-7 w-32 rounded bg-slate-200" />
            <div className="mt-3 h-2.5 w-36 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
    </div>
  );
}

export function ReportErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3.5 text-sm text-rose-800"
    >
      <div className="flex items-center gap-2">
        <MaterialIcon name="error_outline" className="text-[20px] shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 shadow-xs ring-1 ring-rose-200 hover:bg-rose-100"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function ReportEmptyState({
  icon = "query_stats",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <MaterialIcon name={icon} className="text-[26px]" />
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-slate-500">{description}</p>
    </div>
  );
}
