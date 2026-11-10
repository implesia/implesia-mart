"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { dhakaDateString } from "@/lib/admin/inventory";
import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { SalesTrendChart } from "@/app/admin/reports/_components/trend-chart";
import { SummaryCards, summaryCardsFrom } from "@/app/admin/reports/_components/summary-cards";
import { adminButtonClass } from "@/app/admin/_components/admin-ui";
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
    setUpdatedAt(new Date());
    setNow(new Date());
    setRefreshKey((key) => key + 1);
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
    <div className="min-w-0 space-y-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {periodLabel || "Sales in Asia/Dhaka"}
            {comparisonLabel ? (
              <>
                <span className="text-neutral-500"> · </span>
                <span>compared with {comparisonLabel}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="min-w-0 sm:min-w-44">
            <span className="sr-only">Reporting period</span>
            <select
              value={rangeId}
              onChange={(event) => setRangeId(event.target.value as DashboardRangeId)}
              className="h-10 w-full rounded-full border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25"
            >
              {DASHBOARD_RANGE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {rangeId === "custom" ? (
            <div className="flex items-center gap-2">
              <DateField label="From" value={customFrom} onChange={setCustomFrom} />
              <DateField label="To" value={customTo} onChange={setCustomTo} />
            </div>
          ) : null}
          <Link href={reportsPageHref(reportCall)} className={adminButtonClass.quiet}>
            View all reports
          </Link>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MaterialIcon name="refresh" className="text-[18px]" />
            Refresh
          </button>
          {updatedAt ? (
            <p className="text-xs text-neutral-500">
              Updated{" "}
              {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(updatedAt)}
            </p>
          ) : null}
        </div>
      </header>

      {reportError ? (
        <p role="alert" className="rounded-xl bg-error-container px-3 py-2 text-sm text-on-error-container">
          {reportError}
        </p>
      ) : null}

      {overview ? (
        <>
          <SummaryCards cards={cards} />
          {overview.profit.unknownCostLines > 0 ? (
            <p className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning ring-1 ring-warning/30">
              {overview.profit.unknownCostLines.toLocaleString("en-US")} order lines have no cost price.{" "}
              <Link href="/admin/products" className="font-semibold underline">
                Fix cost prices
              </Link>
            </p>
          ) : null}
          <section className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral-950">Net sales and profit</h2>
                <p className="mt-0.5 text-xs text-neutral-600">
                  Delivered orders, by {overview.trend.grain}. Delivered counts use the delivered date.
                </p>
              </div>
              <Link href={reportsPageHref(reportCall)} className="shrink-0 text-sm font-medium text-primary-ink">
                View all reports
              </Link>
            </div>
            <SalesTrendChart points={overview.trend.points} grain={overview.trend.grain} />
          </section>
        </>
      ) : null}

      {legacyLoading && !snapshot ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-busy="true" />
      ) : null}
      {legacyNote ? <p className="text-sm text-neutral-600">{legacyNote}</p> : null}
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
    <label className="flex items-center gap-2 rounded-full bg-white px-3 ring-1 ring-neutral-200">
      <span className="text-xs text-neutral-500">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 bg-transparent text-sm text-neutral-950 outline-none"
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
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
    </div>
  );
}
