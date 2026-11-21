"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { ExportExcelButton } from "@/app/admin/inventory/_components/excel-actions";
import {
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  periodChange,
  type ChannelBreakdownRow,
  type ProductReportRow,
} from "@/lib/admin/reports";
import { MartApiError } from "@/lib/mart-api/products";
import {
  downloadReportExport,
  fetchProducts,
  loadReportOverview,
  type ReportOverview,
} from "@/lib/mart-api/reports";
import { cn } from "@/lib/utils";

import { useReportQuery } from "./report-filters";
import {
  ProfitPill,
  ReportEmptyState,
  ReportErrorBanner,
  ReportKpiCard,
  ReportLoadingSkeleton,
  ReportSectionCard,
  ReportShell,
} from "./report-shell";
import { SalesTrendChart } from "./trend-chart";

type OverviewBundle = {
  key: string;
  overview: ReportOverview | null;
  topProfitable: ProductReportRow[];
  lowOrLoss: ProductReportRow[];
  error: string;
};

export function ReportsOverviewPage() {
  const query = useReportQuery();
  const [reload, setReload] = useState(0);
  const [bundle, setBundle] = useState<OverviewBundle>({
    key: "",
    overview: null,
    topProfitable: [],
    lowOrLoss: [],
    error: "",
  });

  useEffect(() => {
    if (query.queryError) return;
    let active = true;
    Promise.all([
      loadReportOverview(query.call, query.now),
      fetchProducts({ ...query.call, sort: "profit", page: 1, pageSize: 50 }, query.now).catch(
        () => null,
      ),
    ])
      .then(([overview, productsPage]) => {
        if (!active) return;
        const rows = productsPage?.items ?? overview.topProducts?.items ?? [];
        const withKnownProfit = rows.filter((r) => r.profit != null);
        const topProfitable = [...withKnownProfit]
          .filter((r) => (r.profit ?? 0) > 0)
          .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0))
          .slice(0, 5);
        const lowOrLoss = [...withKnownProfit]
          .sort((a, b) => {
            const aLoss = a.isLoss || (a.profit ?? 0) < 0 ? 0 : 1;
            const bLoss = b.isLoss || (b.profit ?? 0) < 0 ? 0 : 1;
            if (aLoss !== bLoss) return aLoss - bLoss;
            const aMargin = a.marginPercent ?? 999;
            const bMargin = b.marginPercent ?? 999;
            return aMargin - bMargin;
          })
          .filter((r) => (r.profit ?? 0) < 0 || (r.marginPercent ?? 100) < 25)
          .slice(0, 5);

        setBundle({
          key: query.requestKey,
          overview,
          topProfitable,
          lowOrLoss,
          error: "",
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setBundle({
          key: query.requestKey,
          overview: null,
          topProfitable: [],
          lowOrLoss: [],
          error:
            error instanceof MartApiError
              ? error.message
              : "Could not load the reports overview.",
        });
      });
    return () => {
      active = false;
    };
  }, [query.call, query.now, query.queryError, query.requestKey, reload]);

  const loading = !query.queryError && bundle.key !== query.requestKey;
  const overview = bundle.key === query.requestKey ? bundle.overview : null;
  const error = bundle.key === query.requestKey ? bundle.error : "";

  const pl = overview?.profitLoss ?? null;
  const prevPl = overview?.previousProfitLoss ?? null;
  const netSales = pl?.netRealizedSales ?? overview?.sales.netSales ?? 0;
  const prevNetSales = prevPl?.netRealizedSales ?? overview?.previousSales.netSales ?? 0;
  const totalCost = pl?.totalCost ?? overview?.profit.cost ?? null;
  const netProfit = pl?.netProfit ?? overview?.profit.netProfit ?? overview?.profit.profit ?? null;
  const prevNetProfit =
    prevPl?.netProfit ?? overview?.previousProfit.netProfit ?? overview?.previousProfit.profit ?? null;
  const margin = pl?.marginPercent ?? overview?.profit.marginPercent ?? null;
  const dueBalance = pl?.dueAmount ?? 0;
  const collected = pl?.collectedAmount ?? netSales;

  const salesDelta = periodChange(netSales, prevNetSales);
  const profitDelta = periodChange(netProfit, prevNetProfit);
  const channels = overview?.channels?.channels ?? [];
  const onlineChannel = channels.find((c) => c.origin === "online") ?? null;
  const offlineChannel = channels.find((c) => c.origin === "offline") ?? null;

  return (
    <ReportShell
      title="Reports Overview"
      subtitle="Executive financial summary across realized delivered orders, COGS, channels, and product profitability."
      query={query}
      exportKind="profit-loss"
      exportLabel="Export P&L Excel"
      extraActions={
        <ExportExcelButton
          label="Export Sales Excel"
          filename={query.exportFilename("sales")}
          onExport={() => downloadReportExport("sales", query.call, query.now)}
        />
      }
      filterNote="Realized metrics count delivered orders minus returned orders (Asia/Dhaka calendar days)."
    >
      {loading ? (
        <ReportLoadingSkeleton cards={8} />
      ) : error ? (
        <ReportErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : !overview ? (
        <ReportEmptyState
          title="No report data available"
          description="Try broadening your date range or clearing filters."
        />
      ) : (
        <div className="space-y-5">
          {/* Unknown cost alert */}
          {(pl?.unknownCostLines ?? overview.profit.unknownCostLines) > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <MaterialIcon name="warning_amber" className="text-[18px] text-amber-700" />
                <span>
                  <strong>
                    {formatReportCount(pl?.unknownCostUnits ?? overview.profit.unknownCostUnits)} units
                  </strong>{" "}
                  ({formatReportMoney(pl?.unknownCostRevenue ?? overview.profit.unknownCostRevenue)} revenue)
                  have no cost price recorded and are excluded from COGS &amp; profit.
                </span>
              </div>
              <Link
                href={query.hrefFor("/admin/reports/products", { profit_filter: "unknown_cost" })}
                className="font-bold text-amber-950 underline underline-offset-2 hover:text-amber-700"
              >
                Inspect missing-cost products →
              </Link>
            </div>
          ) : null}

          {/* 8-card Executive KPI Grid */}
          <section aria-label="Executive financial KPIs" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReportKpiCard
              label="Net Realized Sales"
              value={formatReportMoney(netSales)}
              icon="payments"
              tone="accent"
              badge={<DeltaBadge direction={salesDelta.direction} text={salesDelta.text} />}
              hint={`${formatReportCount(overview.sales.orderCount)} orders · vs prev period`}
            />
            <ReportKpiCard
              label="Total COGS"
              value={formatReportMoney(totalCost)}
              icon="inventory"
              hint="Cost of goods sold on known-cost items"
            />
            <ReportKpiCard
              label="Net Profit / Loss"
              value={formatReportMoney(netProfit)}
              icon="trending_up"
              tone={
                netProfit == null ? "neutral" : netProfit < 0 ? "negative" : "positive"
              }
              badge={<DeltaBadge direction={profitDelta.direction} text={profitDelta.text} />}
              hint={
                pl && pl.lossAmount > 0
                  ? `Includes ${formatReportMoney(pl.lossAmount)} below-cost line loss`
                  : "Known-cost realized revenue minus COGS"
              }
            />
            <ReportKpiCard
              label="Profit Margin"
              value={formatReportPercent(margin)}
              icon="percent"
              tone={
                margin == null ? "neutral" : margin < 0 ? "negative" : margin >= 20 ? "positive" : "warning"
              }
              hint="Net profit ÷ known-cost revenue"
            />
            <ReportKpiCard
              label="Units Sold"
              value={formatReportCount(overview.sales.unitsSold)}
              icon="shopping_bag"
              hint={`Discounts ${formatReportMoney(overview.sales.discount)}`}
            />
            <ReportKpiCard
              label="Delivered Orders"
              value={formatReportCount(overview.delivery.delivered)}
              icon="check_circle"
              tone="positive"
              hint={`Cancelled: ${formatReportCount(overview.delivery.cancelled)}`}
            />
            <ReportKpiCard
              label="Returned Orders"
              value={formatReportCount(overview.delivery.returned)}
              icon="assignment_return"
              tone={overview.delivery.returned > 0 ? "negative" : "neutral"}
              badge={
                overview.delivery.returnRatePercent != null ? (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                    {formatReportPercent(overview.delivery.returnRatePercent)} rate
                  </span>
                ) : null
              }
              hint={`Returned value ${formatReportMoney(overview.delivery.returnedValue ?? pl?.returnedOrderValue ?? 0)}`}
            />
            <ReportKpiCard
              label="Due Balance"
              value={formatReportMoney(dueBalance)}
              icon="account_balance_wallet"
              tone={dueBalance > 0 ? "warning" : "positive"}
              hint={`Collected ${formatReportMoney(collected)}`}
            />
          </section>

          {/* Revenue vs Cost vs Profit Multi-Series Chart */}
          <ReportSectionCard
            title="Revenue vs Cost vs Profit"
            subtitle="Realized net sales, estimated COGS, and profit trajectory across the selected window."
            action={
              <Link
                href={query.hrefFor("/admin/reports/sales")}
                className="text-xs font-semibold text-[#0b3d39] hover:underline"
              >
                Open Sales &amp; Channels →
              </Link>
            }
          >
            <SalesTrendChart
              points={overview.trend.points}
              grain={overview.trend.grain}
              showCost
            />
          </ReportSectionCard>

          {/* Online vs Offline Comparison Cards */}
          <ReportSectionCard
            title="Online vs Offline Channels"
            subtitle="Side-by-side revenue, profit, margin, and cash collection across storefront and counter/phone sales."
            action={
              <Link
                href={query.hrefFor("/admin/reports/sales")}
                className="text-xs font-semibold text-[#0b3d39] hover:underline"
              >
                Payment method breakdown →
              </Link>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ChannelCard
                title="Online (Website)"
                icon="public"
                accent="teal"
                row={onlineChannel}
                totalSales={netSales}
                href={query.hrefFor("/admin/reports/sales", { origin: "online" })}
              />
              <ChannelCard
                title="Offline (Counter / Phone)"
                icon="storefront"
                accent="indigo"
                row={offlineChannel}
                totalSales={netSales}
                href={query.hrefFor("/admin/reports/sales", { origin: "offline" })}
              />
            </div>
          </ReportSectionCard>

          {/* Top 5 Most Profitable + Top 5 Loss / Low-Margin Products */}
          <div className="grid gap-5 xl:grid-cols-2">
            <ReportSectionCard
              title="Top 5 Most Profitable Products"
              subtitle="Highest net profit contributors in the active period."
              padded={false}
              action={
                <Link
                  href={query.hrefFor("/admin/reports/products", {
                    profit_filter: "profit",
                    sort: "profit",
                  })}
                  className="text-xs font-semibold text-[#0b3d39] hover:underline"
                >
                  All profitable →
                </Link>
              }
            >
              <ProductHighlightList
                rows={bundle.topProfitable}
                emptyTitle="No profitable products yet"
                emptyDescription="Products with known cost and positive net profit will appear here."
              />
            </ReportSectionCard>

            <ReportSectionCard
              title="Top 5 Loss & Low-Margin Products"
              subtitle="Products selling below cost or below 25% margin that need pricing review."
              padded={false}
              action={
                <Link
                  href={query.hrefFor("/admin/reports/products", {
                    profit_filter: "loss",
                    sort: "profit",
                  })}
                  className="text-xs font-semibold text-rose-700 hover:underline"
                >
                  Inspect losses →
                </Link>
              }
            >
              <ProductHighlightList
                rows={bundle.lowOrLoss}
                emptyTitle="No loss-making or low-margin items"
                emptyDescription="All known-cost products in this range achieved healthy margins (≥ 25%)."
              />
            </ReportSectionCard>
          </div>
        </div>
      )}
    </ReportShell>
  );
}

function DeltaBadge({
  direction,
  text,
}: {
  direction: "up" | "down" | "flat" | null;
  text: string;
}) {
  if (!direction || text === "—") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
        direction === "up"
          ? "bg-emerald-50 text-emerald-700"
          : direction === "down"
            ? "bg-rose-50 text-rose-700"
            : "bg-slate-100 text-slate-600",
      )}
    >
      {direction === "up" ? "↑" : direction === "down" ? "↓" : "•"} {text}
    </span>
  );
}

function ChannelCard({
  title,
  icon,
  accent,
  row,
  totalSales,
  href,
}: {
  title: string;
  icon: string;
  accent: "teal" | "indigo";
  row: ChannelBreakdownRow | null;
  totalSales: number;
  href: string;
}) {
  const sales = row?.netSales ?? 0;
  const share = totalSales > 0 ? Math.round((sales / totalSales) * 1000) / 10 : 0;
  const barColor = accent === "teal" ? "bg-[#2bc0b5]" : "bg-indigo-500";
  const badgeColor =
    accent === "teal"
      ? "bg-teal-50 text-[#0b3d39] ring-teal-200/70"
      : "bg-indigo-50 text-indigo-800 ring-indigo-200/70";

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("grid size-8 place-items-center rounded-lg ring-1", badgeColor)}>
            <MaterialIcon name={icon} className="text-[18px]" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500">
              {formatReportCount(row?.orderCount ?? 0)} orders · {formatReportCount(row?.units ?? 0)} units
            </p>
          </div>
        </div>
        <Link href={href} className="text-xs font-semibold text-slate-600 hover:text-slate-950">
          Filter →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-slate-500">Net Sales</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-950">
            {formatReportMoney(sales)}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Net Profit</p>
          <p
            className={cn(
              "mt-0.5 text-sm font-bold tabular-nums",
              (row?.profit ?? 0) < 0 ? "text-rose-700" : "text-emerald-700",
            )}
          >
            {formatReportMoney(row?.profit ?? null)}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Margin</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
            {formatReportPercent(row?.marginPercent ?? null)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
          <span>Share of sales: {share}%</span>
          <span>
            Collected {formatReportMoney(row?.collected ?? 0)} · Due {formatReportMoney(row?.due ?? 0)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
          <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(share, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function ProductHighlightList({
  rows,
  emptyTitle,
  emptyDescription,
}: {
  rows: ProductReportRow[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return <ReportEmptyState icon="inventory_2" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="divide-y divide-slate-100">
      {rows.map((row, idx) => (
        <div
          key={`${row.productId ?? row.title}-${idx}`}
          className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50/70 sm:px-5"
        >
          <div className="min-w-0">
            {row.productId ? (
              <Link
                href={`/admin/products/${row.productId}/view`}
                className="block truncate text-sm font-semibold text-slate-900 hover:text-[#0b3d39] hover:underline"
              >
                {row.title}
              </Link>
            ) : (
              <p className="truncate text-sm font-semibold text-slate-900">{row.title}</p>
            )}
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {formatReportCount(row.unitsSold)} units · Revenue {formatReportMoney(row.revenue)}
              {row.supplierName ? ` · ${row.supplierName}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <ProfitPill profit={row.profit} marginPercent={row.marginPercent} showMargin />
          </div>
        </div>
      ))}
    </div>
  );
}
