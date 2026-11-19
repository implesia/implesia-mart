"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, RefreshCw, ArrowUpRight, AlertTriangle, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

import { dhakaDateString } from "@/lib/admin/inventory";
import { SalesTrendChart } from "@/app/admin/reports/_components/trend-chart";
import { SummaryCards, summaryCardsFrom } from "@/app/admin/reports/_components/summary-cards";
import {
  dashboardReportCall,
  formatRangeLabel,
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  periodChange,
  reportsPageHref,
  addIsoDays,
  type ReportCall,
} from "@/lib/admin/reports";
import {
  DASHBOARD_RANGE_OPTIONS,
  DashboardAccessError,
  getDashboardOverview,
  type DashboardRangeId,
  type DashboardSnapshot,
} from "@/lib/mart-api/dashboard";
import { loadReportOverview, type ReportOverview } from "@/lib/mart-api/reports";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import {
  BestSellingProducts,
  OrderActivity,
  OrderAreas,
  RecentOrders,
  SalesInsights,
} from "./dashboard-sections";

export function DashboardView() {
  const [rangeId, setRangeId] = useState<DashboardRangeId>("7d");
  const [customFrom, setCustomFrom] = useState(() => inputDate(-6));
  const [customTo, setCustomTo] = useState(() => inputDate(0));
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reportKey = `${rangeId}|${customFrom}|${customTo}|${now.getTime()}|${refreshKey}`;
  const legacyKey = `${rangeId}|${customFrom}|${customTo}|${refreshKey}`;

  const [reportState, setReportState] = useState<{ key: string; overview: ReportOverview | null; error: string }>({
    key: "",
    overview: null,
    error: "",
  });
  const [legacyState, setLegacyState] = useState<{ key: string; snapshot: DashboardSnapshot | null; note: string }>({
    key: "",
    snapshot: null,
    note: "",
  });

  const overview = reportState.key === reportKey ? reportState.overview : null;
  const reportError = reportState.key === reportKey ? reportState.error : "";
  const reportLoading = reportState.key !== reportKey;
  const snapshot = legacyState.key === legacyKey ? legacyState.snapshot : null;
  const legacyNote = legacyState.key === legacyKey ? legacyState.note : "";
  const legacyLoading = legacyState.key !== legacyKey;
  const reportCall = useMemo<ReportCall>(
    () => dashboardReportCall(rangeId, customFrom, customTo, now),
    [rangeId, customFrom, customTo, now],
  );

  useEffect(() => {
    let cancelled = false;
    const key = reportKey;
    void loadReportOverview(reportCall, now)
      .then((next) => {
        if (!cancelled) setReportState({ key, overview: next, error: "" });
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setReportState({
            key,
            overview: null,
            error: loadError instanceof MartApiError ? loadError.message : "Could not load the dashboard.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reportCall, now, reportKey]);

  useEffect(() => {
    let cancelled = false;
    const key = legacyKey;
    getDashboardOverview({ range: rangeId, from: customFrom, to: customTo })
      .then((next) => {
        if (!cancelled) setLegacyState({ key, snapshot: next, note: "" });
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setLegacyState({
            key,
            snapshot: null,
            note:
              loadError instanceof DashboardAccessError
                ? "Order activity, recent orders, and areas are available to editors."
                : loadError instanceof MartApiError
                  ? loadError.message
                  : "Could not load order activity.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [rangeId, customFrom, customTo, refreshKey, legacyKey]);

  function refresh() {
    setIsRefreshing(true);
    setUpdatedAt(new Date());
    setNow(new Date());
    setRefreshKey((key) => key + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  }

  const cards = overview
    ? summaryCardsFrom({
        netSales: formatReportMoney(overview.sales.netSales),
        profit: formatReportMoney(overview.profit.profit),
        margin: formatReportPercent(overview.profit.marginPercent),
        units: formatReportCount(overview.sales.unitsSold),
        delivered: formatReportCount(overview.delivery.delivered),
        returned: formatReportCount(overview.delivery.returned),
        returnRate: formatReportPercent(overview.delivery.returnRatePercent),
        changes: {
          netSales: periodChange(overview.sales.netSales, overview.previousSales.netSales),
          profit: periodChange(overview.profit.profit, overview.previousProfit.profit),
          margin: periodChange(overview.profit.marginPercent, overview.previousProfit.marginPercent),
          units: periodChange(overview.sales.unitsSold, overview.previousSales.unitsSold),
          delivered: periodChange(overview.delivery.delivered, overview.previousDelivery.delivered),
          returned: periodChange(overview.delivery.returned, overview.previousDelivery.returned),
          returnRate: periodChange(overview.delivery.returnRatePercent, overview.previousDelivery.returnRatePercent),
        },
      })
    : [];

  const periodLabel = overview
    ? formatRangeLabel(overview.sales.filters.from, overview.sales.filters.to)
    : "";
  const comparisonLabel = overview ? formatRangeLabel(overview.previousFrom, overview.previousTo) : "";

  if (reportLoading && !overview && !reportError) return <DashboardSkeleton />;

  return (
    <div className="min-w-0 space-y-5 pb-10">
     {/* Page Header & Toolbar */}
<header className="flex flex-col gap-4">
  {/* Title Section */}
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2bc0b5]/90 text-white shadow-sm shadow-[#2bc0b5]/20">
        <BarChart3 className="h-5 w-5" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        Dashboard
      </h1>
    </div>
    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 sm:pl-11">
      {periodLabel || "Sales in Asia/Dhaka"}
      {comparisonLabel ? (
        <>
          <span className="mx-0.5 text-slate-300">•</span>
          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/60">
            vs {comparisonLabel}
          </span>
        </>
      ) : null}
    </p>
  </div>

  {/* Toolbar Section */}
  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
    {/* Left: Date Range Selector */}
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-0 sm:min-w-[180px]">
        <span className="sr-only">Reporting period</span>
        <select
          value={rangeId}
          onChange={(event) => setRangeId(event.target.value as DashboardRangeId)}
          className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/50 pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        >
          {DASHBOARD_RANGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </label>

      {rangeId === "custom" ? (
        <div className="flex items-center gap-2">
          <DateField label="From" value={customFrom} onChange={setCustomFrom} />
          <DateField label="To" value={customTo} onChange={setCustomTo} />
        </div>
      ) : null}
    </div>

    {/* Right: Actions & Timestamp */}
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
      {updatedAt ? (
        <p className="mr-1 hidden text-[11px] font-medium text-slate-400 sm:block">
          Updated {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(updatedAt)}
        </p>
      ) : null}

      <Link
        href={reportsPageHref(reportCall)}
        className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-[#2bc0b5] transition hover:bg-indigo-50"
      >
        View all reports
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>

      <div className="h-6 w-px bg-slate-200 hidden sm:block" />

      <button
        type="button"
        onClick={refresh}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
      >
        <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", isRefreshing && "animate-spin")} />
        Refresh
      </button>
    </div>
  </div>
</header>

      {/* Error Banner */}
      {reportError ? (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200/50">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {reportError}
        </p>
      ) : null}

      {/* Main KPIs & Chart */}
      {overview ? (
        <>
          <SummaryCards cards={cards} />

          {overview.profit.unknownCostLines > 0 ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200/50">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                <span className="font-semibold">{overview.profit.unknownCostLines.toLocaleString("en-US")}</span> order lines have no cost price.{" "}
                <Link href="/admin/products" className="font-semibold underline decoration-amber-300 underline-offset-2 transition hover:text-amber-950">
                  Fix cost prices
                </Link>
              </p>
            </div>
          ) : null}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-1.5 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Net sales and profit</h2>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  Delivered orders, by {overview.trend.grain}. Delivered counts use the delivered date.
                </p>
              </div>
              <Link
                href={reportsPageHref(reportCall)}
                className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
              >
                View all reports
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="p-4 sm:p-5">
              <SalesTrendChart points={overview.trend.points} grain={overview.trend.grain} />
            </div>
          </section>
        </>
      ) : null}

      {/* Secondary Dashboard Sections */}
      {legacyLoading && !snapshot ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy="true">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : null}

      {legacyNote ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
          {legacyNote}
        </p>
      ) : null}

      {snapshot ? (
        <>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <OrderActivity statuses={snapshot.statuses} total={snapshot.orderCount} />
            <BestSellingProducts products={snapshot.bestSellers} />
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
            <RecentOrders orders={snapshot.recent} />
            <div className="space-y-4">
              <OrderAreas areas={snapshot.areas} />
              <SalesInsights categories={snapshot.categories} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-xs font-medium text-slate-700 outline-none"
      />
    </label>
  );
}

function inputDate(offsetDays: number) {
  const today = dhakaDateString(new Date());
  return addIsoDays(today, offsetDays) ?? today;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}