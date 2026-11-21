"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Globe,
  Info,
  Landmark,
  Percent,
  RefreshCw,
  Store,
  TrendingDown,
  TrendingUp,
  Wallet,
  Warehouse,
} from "lucide-react";

import { dhakaDateString } from "@/lib/admin/inventory";
import { SalesTrendChart } from "@/app/admin/reports/_components/trend-chart";
import { ChangeLine } from "@/app/admin/reports/_components/summary-cards";
import {
  addIsoDays,
  dashboardReportCall,
  formatRangeLabel,
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  periodChange,
  reportsPageHref,
  type ChannelBreakdownReport,
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

  const [reportState, setReportState] = useState<{
    key: string;
    overview: ReportOverview | null;
    error: string;
  }>({
    key: "",
    overview: null,
    error: "",
  });
  const [legacyState, setLegacyState] = useState<{
    key: string;
    snapshot: DashboardSnapshot | null;
    note: string;
  }>({
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
            error:
              loadError instanceof MartApiError
                ? loadError.message
                : "Could not load the dashboard.",
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

  const periodLabel = overview
    ? formatRangeLabel(overview.sales.filters.from, overview.sales.filters.to)
    : "";
  const comparisonLabel = overview
    ? formatRangeLabel(overview.previousFrom, overview.previousTo)
    : "";

  const pnl = overview?.profitLoss ?? null;
  const prevPnl = overview?.previousProfitLoss ?? null;

  const netRealizedSales = pnl ? pnl.netRealizedSales : (overview?.sales.netSales ?? 0);
  const prevRealizedSales = prevPnl
    ? prevPnl.netRealizedSales
    : (overview?.previousSales.netSales ?? 0);
  const totalCogs = pnl ? pnl.totalCost : (overview?.profit.cost ?? null);
  const prevCogs = prevPnl ? prevPnl.totalCost : (overview?.previousProfit.cost ?? null);
  const netProfit = pnl ? pnl.netProfit : (overview?.profit.profit ?? null);
  const prevNetProfit = prevPnl ? prevPnl.netProfit : (overview?.previousProfit.profit ?? null);
  const lossAmount = pnl?.lossAmount ?? overview?.profit.lossAmount ?? 0;
  const marginPercent = pnl ? pnl.marginPercent : (overview?.profit.marginPercent ?? null);
  const prevMarginPercent = prevPnl
    ? prevPnl.marginPercent
    : (overview?.previousProfit.marginPercent ?? null);
  const collectedAmount = pnl?.collectedAmount ?? netRealizedSales;
  const dueAmount = pnl?.dueAmount ?? 0;
  const stockCapital = overview?.stock?.summary.stockValue ?? null;
  const potentialRetail = overview?.stock?.summary.potentialRetailValue ?? null;
  const unknownCostLines = pnl?.unknownCostLines ?? overview?.profit.unknownCostLines ?? 0;
  const unknownCostUnits = pnl?.unknownCostUnits ?? overview?.profit.unknownCostUnits ?? 0;

  if (reportLoading && !overview && !reportError) return <DashboardSkeleton />;

  return (
    <div className="min-w-0 space-y-5 pb-10">
      {/* Page Header & Toolbar */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2bc0b5]/90 text-white shadow-sm shadow-[#2bc0b5]/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Executive Dashboard
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

        {/* Toolbar */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
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

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {updatedAt ? (
              <p className="mr-1 hidden text-[11px] font-medium text-slate-400 sm:block">
                Updated{" "}
                {new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                }).format(updatedAt)}
              </p>
            ) : null}

            <Link
              href={reportsPageHref(reportCall)}
              className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-[#2bc0b5] transition hover:bg-teal-50"
            >
              Reports Hub
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            <button
              type="button"
              onClick={refresh}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 text-slate-500", isRefreshing && "animate-spin")}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {reportError ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200/50"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {reportError}
        </p>
      ) : null}

      {/* Executive Financial KPI Strip */}
      {overview ? (
        <>
          <section aria-label="Financial KPIs" className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Realized Financial Performance
                </h2>
                <span
                  title="Realized figures count delivered orders only and exclude all returned and cancelled orders."
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 ring-1 ring-inset ring-teal-200/70"
                >
                  <Info className="h-3 w-3" />
                  Realized = Delivered minus Returned
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 tabular-nums">
                {formatReportCount(overview.sales.orderCount)} realized orders ·{" "}
                {formatReportCount(overview.sales.unitsSold)} units ·{" "}
                {formatReportCount(overview.delivery.returned)} returned (
                {formatReportPercent(overview.delivery.returnRatePercent)})
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {/* 1. Net Realized Sales */}
              <FinancialKpiCard
                label="Net Realized Sales"
                value={formatReportMoney(netRealizedSales)}
                icon={Wallet}
                iconTone="bg-[#2bc0b5]/10 text-[#2bc0b5] ring-[#2bc0b5]/20"
                change={periodChange(netRealizedSales, prevRealizedSales)}
                hint={
                  pnl && pnl.returnedOrderValue > 0
                    ? `Delivered net of discounts. ${formatReportMoney(pnl.returnedOrderValue)} returned excluded.`
                    : "Delivered orders net of product, coupon & manual discounts."
                }
                href="/admin/reports/profit-loss"
              />

              {/* 2. Total Cost / COGS */}
              <FinancialKpiCard
                label="Total Cost (COGS)"
                value={formatReportMoney(totalCogs)}
                icon={CircleDollarSign}
                iconTone="bg-slate-100 text-slate-700 ring-slate-200"
                change={periodChange(totalCogs, prevCogs)}
                hint={
                  unknownCostUnits > 0
                    ? `Known-cost lines only (${formatReportCount(unknownCostUnits)} units missing cost).`
                    : "Snapshotted unit cost across all realized delivered items."
                }
                href="/admin/reports/profit-loss"
              />

              {/* 3. Net Profit / Loss */}
              <FinancialKpiCard
                label="Net Profit / Loss"
                value={formatReportMoney(netProfit)}
                icon={netProfit != null && netProfit < 0 ? TrendingDown : TrendingUp}
                iconTone={
                  netProfit != null && netProfit < 0
                    ? "bg-rose-50 text-rose-700 ring-rose-200"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                }
                valueClassName={
                  netProfit != null && netProfit < 0
                    ? "text-rose-700"
                    : netProfit != null && netProfit > 0
                      ? "text-emerald-700"
                      : "text-slate-900"
                }
                badge={
                  netProfit != null ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        netProfit < 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {netProfit < 0 ? "Loss" : "Profit"}
                    </span>
                  ) : null
                }
                change={periodChange(netProfit, prevNetProfit)}
                hint={
                  lossAmount > 0
                    ? `Includes ${formatReportMoney(lossAmount)} loss from below-cost lines.`
                    : "Realized merchandise revenue minus COGS (excludes delivery)."
                }
                href="/admin/reports/profit-loss"
              />

              {/* 4. Profit Margin (%) */}
              <FinancialKpiCard
                label="Profit Margin"
                value={formatReportPercent(marginPercent)}
                icon={Percent}
                iconTone="bg-indigo-50 text-indigo-600 ring-indigo-200/70"
                change={periodChange(marginPercent, prevMarginPercent)}
                hint="Net profit divided by realized known-cost merchandise revenue."
                href="/admin/reports/products"
              />

              {/* 5. Collected vs Due */}
              <FinancialKpiCard
                label="Collected vs Due"
                value={formatReportMoney(collectedAmount)}
                icon={Landmark}
                iconTone="bg-emerald-50 text-emerald-700 ring-emerald-200/70"
                badge={
                  dueAmount > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 tabular-nums">
                      Due {formatReportMoney(dueAmount)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Settled
                    </span>
                  )
                }
                hint="Paid amounts & settled COD vs uncollected receivables on delivered orders."
                href="/admin/reports/sales"
              />

              {/* 6. Stock Capital Value */}
              <FinancialKpiCard
                label="Stock Capital Value"
                value={formatReportMoney(stockCapital)}
                icon={Warehouse}
                iconTone="bg-sky-50 text-sky-700 ring-sky-200/70"
                badge={
                  overview.stock?.summary.lowStockCount ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/60 tabular-nums">
                      {overview.stock.summary.lowStockCount} low stock
                    </span>
                  ) : null
                }
                hint={
                  potentialRetail != null && potentialRetail > 0
                    ? `Current on-hand cost value · Potential retail ${formatReportMoney(potentialRetail)}.`
                    : "Current on-hand quantity × cost price across active catalog."
                }
                href="/admin/reports/inventory"
              />
            </div>
          </section>

          {/* Unknown Cost Alert Banner */}
          {unknownCostLines > 0 || unknownCostUnits > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-inset ring-amber-200/50">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  <span className="font-bold tabular-nums">
                    {formatReportCount(unknownCostLines)}
                  </span>{" "}
                  sold order {unknownCostLines === 1 ? "line" : "lines"} (
                  <span className="font-semibold tabular-nums">
                    {formatReportCount(unknownCostUnits)}
                  </span>{" "}
                  units) are missing a cost price, so their profit is excluded from totals.
                </p>
              </div>
              <Link
                href="/admin/reports/products?profit_filter=unknown_cost"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-950"
              >
                Review unknown-cost products
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}

          {/* Online vs Offline Channel Summary Bar */}
          {overview.channels ? <ChannelSummaryBar channels={overview.channels} /> : null}

          {/* Trend Chart */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-1.5 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Net realized sales & profit</h2>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  Realized delivered orders by {overview.trend.grain} (returned orders excluded).
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

      {/* Secondary Operational Sections */}
      {legacyLoading && !snapshot ? (
        <div
          className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
          aria-busy="true"
        >
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
            <BestSellingProducts
              products={snapshot.bestSellers}
              profitRows={overview?.topProducts?.items ?? []}
            />
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

function FinancialKpiCard({
  label,
  value,
  icon: Icon,
  iconTone,
  valueClassName,
  badge,
  change,
  hint,
  href,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  valueClassName?: string;
  badge?: React.ReactNode;
  change?: { direction: "up" | "down" | "flat" | null; text: string };
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-[#2bc0b5]/50 hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
              iconTone,
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <p
            className={cn(
              "text-2xl font-bold tabular-nums tracking-tight text-slate-900",
              valueClassName,
            )}
          >
            {value}
          </p>
          {badge}
        </div>

        {change ? (
          <div className="mt-1.5 flex items-center gap-2">
            <ChangeLine change={change} />
          </div>
        ) : null}
      </div>

      <p className="mt-2.5 text-[11px] font-medium leading-relaxed text-slate-500">{hint}</p>
    </Link>
  );
}

function ChannelSummaryBar({ channels }: { channels: ChannelBreakdownReport }) {
  const online = channels.channels.find((row) => row.origin === "online");
  const offline = channels.channels.find((row) => row.origin === "offline");
  const totalSales = (online?.netSales ?? 0) + (offline?.netSales ?? 0);
  const onlineShare = totalSales > 0 ? Math.round(((online?.netSales ?? 0) / totalSales) * 100) : 0;
  const offlineShare = totalSales > 0 ? 100 - onlineShare : 0;

  return (
    <section
      aria-label="Online vs offline summary"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Online vs Offline Channels</h2>
          <p className="text-[11px] font-medium text-slate-500">
            Realized delivered sales, profit, and collection split by order origin.
          </p>
        </div>
        <Link
          href="/admin/reports/sales"
          className="group inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Channel & payment details
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Visual Split Bar */}
      <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        {totalSales > 0 ? (
          <div className="flex h-full w-full">
            <div
              className="h-full bg-[#2bc0b5] transition-all duration-500"
              style={{ width: `${onlineShare}%` }}
            />
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${offlineShare}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ChannelTile
          title="Online (Website)"
          share={onlineShare}
          dotClass="bg-[#2bc0b5]"
          icon={Globe}
          orders={online?.orderCount ?? 0}
          units={online?.units ?? 0}
          netSales={online?.netSales ?? 0}
          profit={online?.profit ?? null}
          collected={online?.collected ?? 0}
          due={online?.due ?? 0}
        />
        <ChannelTile
          title="Offline (Counter / Phone)"
          share={offlineShare}
          dotClass="bg-indigo-500"
          icon={Store}
          orders={offline?.orderCount ?? 0}
          units={offline?.units ?? 0}
          netSales={offline?.netSales ?? 0}
          profit={offline?.profit ?? null}
          collected={offline?.collected ?? 0}
          due={offline?.due ?? 0}
        />
      </div>
    </section>
  );
}

function ChannelTile({
  title,
  share,
  dotClass,
  icon: Icon,
  orders,
  units,
  netSales,
  profit,
  collected,
  due,
}: {
  title: string;
  share: number;
  dotClass: string;
  icon: React.ComponentType<{ className?: string }>;
  orders: number;
  units: number;
  netSales: number;
  profit: number | null;
  collected: number;
  due: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <span className={cn("h-2.5 w-2.5 rounded-full", dotClass)} />
          <Icon className="h-3.5 w-3.5 text-slate-500" />
          {title}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200/70 tabular-nums">
          {share}%
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-bold text-slate-900 tabular-nums">
          {formatReportMoney(netSales)}
        </p>
        <p className="text-xs font-medium text-slate-500 tabular-nums">
          {formatReportCount(orders)} orders · {formatReportCount(units)} units
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2 text-[11px] font-medium text-slate-600 tabular-nums">
        <span>
          Profit:{" "}
          <strong
            className={cn(
              profit != null && profit < 0
                ? "text-rose-700"
                : profit != null && profit > 0
                  ? "text-emerald-700"
                  : "text-slate-700",
            )}
          >
            {formatReportMoney(profit)}
          </strong>
        </span>
        <span>
          Collected {formatReportMoney(collected)}
          {due > 0 ? <strong className="ml-1.5 text-amber-700">· Due {formatReportMoney(due)}</strong> : null}
        </span>
      </div>
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
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </div>
      <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}
