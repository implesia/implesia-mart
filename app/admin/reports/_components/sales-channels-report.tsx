"use client";

import { useEffect, useState } from "react";

import { ExportExcelButton } from "@/app/admin/inventory/_components/excel-actions";
import {
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  type ChannelBreakdownReport,
  type SalesSummary,
  type TrendReport,
} from "@/lib/admin/reports";
import { MartApiError } from "@/lib/mart-api/products";
import {
  downloadReportExport,
  fetchChannels,
  fetchSales,
  fetchTrend,
} from "@/lib/mart-api/reports";
import { cn } from "@/lib/utils";

import { GRAIN_LABELS, useReportQuery } from "./report-filters";
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

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: "Cash on Delivery (COD)",
  bangla_qr: "Bangla QR",
  cash: "Cash (Counter)",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card / POS",
  due: "Due / Credit",
  unknown: "Unspecified",
};

function paymentLabel(code: string) {
  const key = code.trim().toLowerCase();
  return PAYMENT_METHOD_LABEL[key] ?? code.toUpperCase();
}

export function SalesChannelsReportView() {
  const query = useReportQuery();
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<{
    key: string;
    sales: SalesSummary | null;
    trend: TrendReport | null;
    channels: ChannelBreakdownReport | null;
    error: string;
  }>({ key: "", sales: null, trend: null, channels: null, error: "" });

  useEffect(() => {
    if (query.queryError) return;
    let active = true;
    Promise.all([
      fetchSales(query.call, query.now),
      fetchTrend(query.call, query.now),
      fetchChannels(query.call, query.now),
    ])
      .then(([sales, trend, channels]) => {
        if (active) setState({ key: query.requestKey, sales, trend, channels, error: "" });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          key: query.requestKey,
          sales: null,
          trend: null,
          channels: null,
          error:
            error instanceof MartApiError
              ? error.message
              : "Could not load sales and channel analytics.",
        });
      });
    return () => {
      active = false;
    };
  }, [query.call, query.now, query.queryError, query.requestKey, reload]);

  const loading = !query.queryError && state.key !== query.requestKey;
  const sales = state.key === query.requestKey ? state.sales : null;
  const trend = state.key === query.requestKey ? state.trend : null;
  const channels = state.key === query.requestKey ? state.channels : null;
  const error = state.key === query.requestKey ? state.error : "";

  const channelRows = channels?.channels ?? [];
  const paymentRows = channels?.paymentMethods ?? [];
  const totalChannelSales = channelRows.reduce((sum, row) => sum + row.netSales, 0);

  return (
    <ReportShell
      title="Sales & Channels Report"
      subtitle="Time-series revenue & profit trends alongside Online vs Offline and payment-method cash collection."
      query={query}
      exportKind="channels"
      exportLabel="Export Channels Excel"
      showGrain
      extraActions={
        <ExportExcelButton
          label="Export Trend Excel"
          filename={query.exportFilename("trend")}
          onExport={() => downloadReportExport("trend", query.call, query.now)}
        />
      }
    >
      {loading ? (
        <ReportLoadingSkeleton cards={4} />
      ) : error ? (
        <ReportErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : !sales || !trend ? (
        <ReportEmptyState
          title="No sales data available"
          description="Try widening the date range or resetting active filters."
        />
      ) : (
        <div className="space-y-5">
          {/* Sales KPI Strip */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Net Realized Sales"
              value={formatReportMoney(sales.netSales)}
              icon="trending_up"
              tone="accent"
              hint={`Gross ${formatReportMoney(sales.grossSales)}`}
            />
            <ReportKpiCard
              label="Realized Orders"
              value={formatReportCount(sales.orderCount)}
              icon="receipt_long"
              hint={`${formatReportCount(sales.unitsSold)} units delivered`}
            />
            <ReportKpiCard
              label="Total Discounts"
              value={formatReportMoney(sales.discount)}
              icon="local_offer"
              hint={`Coupons ${formatReportMoney(sales.couponDiscount)} · Manual ${formatReportMoney(sales.manualDiscount ?? 0)}`}
            />
            <ReportKpiCard
              label="Delivery Charges"
              value={formatReportMoney(sales.deliveryCharge)}
              icon="local_shipping"
              hint="Collected on delivered orders"
            />
          </section>

          {/* Time-Series Chart with Grain Pills */}
          <ReportSectionCard
            title="Revenue, Cost & Profit Trend"
            subtitle={`Bucketed by ${GRAIN_LABELS[trend.grain].toLowerCase()} intervals (Asia/Dhaka).`}
            action={
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 print:hidden">
                {(["day", "week", "month"] as const).map((grain) => {
                  const active = (query.grain ?? trend.grain) === grain;
                  return (
                    <button
                      key={grain}
                      type="button"
                      onClick={() => query.update({ grain })}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                        active
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900",
                      )}
                    >
                      {GRAIN_LABELS[grain]}
                    </button>
                  );
                })}
              </div>
            }
          >
            <SalesTrendChart points={trend.points} grain={trend.grain} showCost />
          </ReportSectionCard>

          {/* Online vs Offline Channel Breakdown */}
          <ReportSectionCard
            title="Online vs Offline Breakdown"
            subtitle="Comparison of storefront orders vs offline counter/phone orders."
            padded={false}
          >
            {channelRows.length === 0 ? (
              <ReportEmptyState
                title="No channel activity"
                description="Delivered orders in this range will be split by Online and Offline channels."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Channel</th>
                      <th className="px-4 py-3 text-right font-semibold">Orders</th>
                      <th className="px-4 py-3 text-right font-semibold">Units</th>
                      <th className="px-4 py-3 text-right font-semibold">Net Sales</th>
                      <th className="px-4 py-3 text-right font-semibold">Share</th>
                      <th className="px-4 py-3 text-right font-semibold">COGS</th>
                      <th className="px-4 py-3 text-right font-semibold">Profit</th>
                      <th className="px-4 py-3 text-right font-semibold">Margin</th>
                      <th className="px-4 py-3 text-right font-semibold">Collected</th>
                      <th className="px-4 py-3 text-right font-semibold">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {channelRows.map((row) => {
                      const share =
                        totalChannelSales > 0
                          ? Math.round((row.netSales / totalChannelSales) * 1000) / 10
                          : 0;
                      return (
                        <tr key={row.origin} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-950">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className={cn(
                                  "size-2 rounded-full",
                                  row.origin === "online" ? "bg-[#2bc0b5]" : "bg-indigo-500",
                                )}
                              />
                              {row.origin === "online"
                                ? "Online (Website)"
                                : "Offline (Counter / Phone)"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">{formatReportCount(row.orderCount)}</td>
                          <td className="px-4 py-3 text-right">{formatReportCount(row.units)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-950">
                            {formatReportMoney(row.netSales)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500">{share}%</td>
                          <td className="px-4 py-3 text-right">{formatReportMoney(row.cogs)}</td>
                          <td className="px-4 py-3 text-right">
                            <ProfitPill profit={row.profit} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">
                            {formatReportPercent(row.marginPercent)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                            {formatReportMoney(row.collected)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-700">
                            {formatReportMoney(row.due)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ReportSectionCard>

          {/* Payment Method Breakdown */}
          <ReportSectionCard
            title="Payment Method Breakdown"
            subtitle="COD, Bangla QR, Cash, bKash, Nagad, Card, and Due collection tracking."
            padded={false}
          >
            {paymentRows.length === 0 ? (
              <ReportEmptyState
                icon="payments"
                title="No payment method rows"
                description="Realized delivered orders will appear here grouped by payment method."
              />
            ) : (
              <>
                <ul className="divide-y divide-slate-100 md:hidden">
                  {paymentRows.map((row) => (
                    <li key={row.paymentMethod} className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-950">
                          {paymentLabel(row.paymentMethod)}
                        </p>
                        <ProfitPill profit={row.profit} marginPercent={row.marginPercent} showMargin />
                      </div>
                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs tabular-nums">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Net Sales</span>
                          <span className="font-semibold text-slate-950">
                            {formatReportMoney(row.netSales)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Collected</span>
                          <span className="font-semibold text-emerald-700">
                            {formatReportMoney(row.collected)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Due</span>
                          <span className="font-semibold text-amber-700">
                            {formatReportMoney(row.due)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[44rem] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Payment Method</th>
                        <th className="px-4 py-3 text-right font-semibold">Orders</th>
                        <th className="px-4 py-3 text-right font-semibold">Units</th>
                        <th className="px-4 py-3 text-right font-semibold">Net Sales</th>
                        <th className="px-4 py-3 text-right font-semibold">COGS</th>
                        <th className="px-4 py-3 text-right font-semibold">Profit</th>
                        <th className="px-4 py-3 text-right font-semibold">Margin</th>
                        <th className="px-4 py-3 text-right font-semibold">Collected</th>
                        <th className="px-4 py-3 text-right font-semibold">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {paymentRows.map((row) => (
                        <tr key={row.paymentMethod} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-950">
                            {paymentLabel(row.paymentMethod)}
                          </td>
                          <td className="px-4 py-3 text-right">{formatReportCount(row.orderCount)}</td>
                          <td className="px-4 py-3 text-right">{formatReportCount(row.units)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-950">
                            {formatReportMoney(row.netSales)}
                          </td>
                          <td className="px-4 py-3 text-right">{formatReportMoney(row.cogs)}</td>
                          <td className="px-4 py-3 text-right">
                            <ProfitPill profit={row.profit} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">
                            {formatReportPercent(row.marginPercent)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                            {formatReportMoney(row.collected)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-700">
                            {formatReportMoney(row.due)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </ReportSectionCard>
        </div>
      )}
    </ReportShell>
  );
}
