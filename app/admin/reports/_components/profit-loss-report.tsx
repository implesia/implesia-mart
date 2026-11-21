"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  type ProfitLossReport,
} from "@/lib/admin/reports";
import { MartApiError } from "@/lib/mart-api/products";
import { fetchProfitLoss } from "@/lib/mart-api/reports";
import { cn } from "@/lib/utils";

import { useReportQuery } from "./report-filters";
import {
  ReportEmptyState,
  ReportErrorBanner,
  ReportKpiCard,
  ReportLoadingSkeleton,
  ReportSectionCard,
  ReportShell,
} from "./report-shell";

export function ProfitLossReportView() {
  const query = useReportQuery();
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<{
    key: string;
    report: ProfitLossReport | null;
    error: string;
  }>({ key: "", report: null, error: "" });

  useEffect(() => {
    if (query.queryError) return;
    let active = true;
    fetchProfitLoss(query.call, query.now)
      .then((report) => {
        if (active) setState({ key: query.requestKey, report, error: "" });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          key: query.requestKey,
          report: null,
          error:
            error instanceof MartApiError
              ? error.message
              : "Could not load the Profit & Loss statement.",
        });
      });
    return () => {
      active = false;
    };
  }, [query.call, query.now, query.queryError, query.requestKey, reload]);

  const loading = !query.queryError && state.key !== query.requestKey;
  const report = state.key === query.requestKey ? state.report : null;
  const error = state.key === query.requestKey ? state.error : "";

  const totalDiscounts = report
    ? report.productDiscount + report.couponDiscount + report.manualDiscount
    : 0;
  const netMerchandiseSales = report
    ? report.netRealizedSales - report.deliveryCharge
    : 0;
  const totalBillable = report ? report.collectedAmount + report.dueAmount : 0;
  const collectionRate =
    totalBillable > 0 && report
      ? Math.round((report.collectedAmount / totalBillable) * 1000) / 10
      : 0;

  return (
    <ReportShell
      title="Profit & Loss Statement"
      subtitle="Accounting-grade income statement across gross sales, discounts, returns, COGS, net profit, and cash collection."
      query={query}
      exportKind="profit-loss"
      exportLabel="Export P&L Excel"
      filterNote="Returned orders are excluded from Net Realized Sales and shown separately for audit visibility."
    >
      {loading ? (
        <ReportLoadingSkeleton cards={4} />
      ) : error ? (
        <ReportErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : !report ? (
        <ReportEmptyState
          title="No Profit & Loss data"
          description="No realized orders match the active period and filters."
        />
      ) : (
        <div className="space-y-5">
          {/* Top KPI Summary */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Net Realized Sales"
              value={formatReportMoney(report.netRealizedSales)}
              icon="account_balance"
              tone="accent"
              hint={`Gross ${formatReportMoney(report.grossSales)} − Discounts ${formatReportMoney(totalDiscounts)}`}
            />
            <ReportKpiCard
              label="Cost of Goods Sold (COGS)"
              value={formatReportMoney(report.totalCost)}
              icon="inventory"
              hint="Sum of line qty × recorded unit cost"
            />
            <ReportKpiCard
              label="Net Profit / Loss"
              value={formatReportMoney(report.netProfit)}
              icon="trending_up"
              tone={
                report.netProfit == null
                  ? "neutral"
                  : report.netProfit < 0
                    ? "negative"
                    : "positive"
              }
              badge={
                report.marginPercent != null ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                      (report.netProfit ?? 0) < 0
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    {formatReportPercent(report.marginPercent)} margin
                  </span>
                ) : null
              }
              hint={
                report.lossAmount > 0
                  ? `Below-cost line losses: ${formatReportMoney(report.lossAmount)}`
                  : "Net merchandise revenue minus COGS"
              }
            />
            <ReportKpiCard
              label="Cash Collected vs Due"
              value={formatReportMoney(report.collectedAmount)}
              icon="payments"
              tone={report.dueAmount > 0 ? "warning" : "positive"}
              hint={`Uncollected due: ${formatReportMoney(report.dueAmount)} (${collectionRate}% collected)`}
            />
          </section>

          {/* Unknown Cost Lines Audit Callout */}
          {report.unknownCostLines > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
              <div className="flex items-start gap-3">
                <MaterialIcon name="fact_check" className="mt-0.5 text-[22px] text-amber-700" />
                <div>
                  <p className="font-bold">Unknown-Cost Audit Notice</p>
                  <p className="mt-0.5 text-xs text-amber-900">
                    <strong>{formatReportCount(report.unknownCostLines)}</strong> order lines (
                    <strong>{formatReportCount(report.unknownCostUnits)}</strong> units,{" "}
                    <strong>{formatReportMoney(report.unknownCostRevenue)}</strong> revenue) had no
                    recorded unit cost at sale time. COGS &amp; Net Profit are calculated strictly
                    from known-cost lines without guessing.
                  </p>
                </div>
              </div>
              <Link
                href={query.hrefFor("/admin/reports/products", { profit_filter: "unknown_cost" })}
                className="rounded-xl bg-amber-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-amber-800"
              >
                Review missing-cost products
              </Link>
            </div>
          ) : null}

          {/* Main Accounting P&L Statement + Collection Breakdown */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <ReportSectionCard
              title="Income Statement (P&L Waterfall)"
              subtitle={`Accounting breakdown for ${query.rangeLabel} (Asia/Dhaka).`}
              padded={false}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Line Item</th>
                      <th className="px-5 py-3 text-right font-semibold">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <PlRow
                      label="Gross Sales (List Value)"
                      note="Regular / list price × units delivered"
                      amount={formatReportMoney(report.grossSales)}
                    />
                    <PlRow
                      label="(−) Product & Quantity Discounts"
                      note="Catalog base discounts & bulk quantity tier savings"
                      amount={report.productDiscount > 0 ? `−${formatReportMoney(report.productDiscount)}` : formatReportMoney(0)}
                      tone="muted"
                      indent
                    />
                    <PlRow
                      label="(−) Coupon Discounts"
                      note="Promo code discounts applied on orders"
                      amount={report.couponDiscount > 0 ? `−${formatReportMoney(report.couponDiscount)}` : formatReportMoney(0)}
                      tone="muted"
                      indent
                    />
                    <PlRow
                      label="(−) Manual / Staff Discounts"
                      note="Offline or negotiated manual discounts"
                      amount={report.manualDiscount > 0 ? `−${formatReportMoney(report.manualDiscount)}` : formatReportMoney(0)}
                      tone="muted"
                      indent
                    />
                    <PlRow
                      label="(=) Net Merchandise Sales"
                      note="Delivered product revenue after all discounts"
                      amount={formatReportMoney(netMerchandiseSales)}
                      emphasis="subtotal"
                    />
                    <PlRow
                      label="(+) Delivery Charges"
                      note="Shipping fees collected on delivered orders"
                      amount={formatReportMoney(report.deliveryCharge)}
                      indent
                    />
                    <PlRow
                      label="(=) Net Realized Sales"
                      note="Total realized sales (excludes returned orders)"
                      amount={formatReportMoney(report.netRealizedSales)}
                      emphasis="subtotal"
                    />
                    <PlRow
                      label="(−) Cost of Goods Sold (COGS)"
                      note="Unit cost × quantity across known-cost lines"
                      amount={
                        report.totalCost != null
                          ? `−${formatReportMoney(report.totalCost)}`
                          : "—"
                      }
                      tone="negative"
                    />
                    <PlRow
                      label="(=) Gross Profit"
                      note="Known-cost net merchandise revenue minus COGS"
                      amount={formatReportMoney(report.grossProfit)}
                      emphasis="subtotal"
                    />
                    {report.lossAmount > 0 ? (
                      <PlRow
                        label="Memo: Below-Cost Line Losses"
                        note="Sum of negative-profit lines already reflected in Net Profit"
                        amount={`−${formatReportMoney(report.lossAmount)}`}
                        tone="negative"
                        indent
                      />
                    ) : null}
                    <PlRow
                      label="Memo: Returned Orders Value"
                      note="Value of orders returned in this window (already excluded above)"
                      amount={formatReportMoney(report.returnedOrderValue)}
                      tone="muted"
                      indent
                    />
                    <tr
                      className={cn(
                        "border-t-2 font-bold",
                        (report.netProfit ?? 0) < 0
                          ? "border-rose-200 bg-rose-50/70 text-rose-900"
                          : "border-emerald-200 bg-emerald-50/70 text-emerald-950",
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base">Net Profit / Loss</span>
                          {report.marginPercent != null ? (
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
                                (report.netProfit ?? 0) < 0
                                  ? "bg-rose-200/80 text-rose-900"
                                  : "bg-emerald-200/80 text-emerald-950",
                              )}
                            >
                              {formatReportPercent(report.marginPercent)} Margin
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs font-normal opacity-80">
                          Bottom-line realized profit after COGS &amp; discounts
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right text-lg tabular-nums">
                        {formatReportMoney(report.netProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ReportSectionCard>

            {/* Right column: Collection & Receivables */}
            <div className="space-y-4">
              <ReportSectionCard
                title="Receivables & Cash Collection"
                subtitle="Settled payments vs remaining customer due."
              >
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">Collection Rate</span>
                      <span className="tabular-nums text-slate-950">{collectionRate}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(collectionRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  <dl className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 px-3.5 py-2.5">
                      <dt className="font-medium text-emerald-900">Collected Amount</dt>
                      <dd className="font-bold tabular-nums text-emerald-800">
                        {formatReportMoney(report.collectedAmount)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-amber-50/70 px-3.5 py-2.5">
                      <dt className="font-medium text-amber-900">Uncollected Due</dt>
                      <dd className="font-bold tabular-nums text-amber-800">
                        {formatReportMoney(report.dueAmount)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                      <dt className="font-medium text-slate-600">Returned Value</dt>
                      <dd className="font-bold tabular-nums text-slate-900">
                        {formatReportMoney(report.returnedOrderValue)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </ReportSectionCard>

              <ReportSectionCard
                title="Drill-Down Shortcuts"
                subtitle="Continue investigating this period."
              >
                <div className="space-y-2">
                  <Link
                    href={query.hrefFor("/admin/reports/products", { profit_filter: "loss" })}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    <span>Inspect loss-making products</span>
                    <MaterialIcon name="arrow_forward" className="text-[16px] text-slate-400" />
                  </Link>
                  <Link
                    href={query.hrefFor("/admin/reports/sales")}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    <span>Channel &amp; payment breakdown</span>
                    <MaterialIcon name="arrow_forward" className="text-[16px] text-slate-400" />
                  </Link>
                  <Link
                    href={query.hrefFor("/admin/reports/suppliers")}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    <span>Supplier profit performance</span>
                    <MaterialIcon name="arrow_forward" className="text-[16px] text-slate-400" />
                  </Link>
                </div>
              </ReportSectionCard>
            </div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}

function PlRow({
  label,
  note,
  amount,
  indent = false,
  tone = "default",
  emphasis,
}: {
  label: string;
  note: string;
  amount: string;
  indent?: boolean;
  tone?: "default" | "muted" | "negative";
  emphasis?: "subtotal";
}) {
  return (
    <tr className={cn(emphasis === "subtotal" && "bg-slate-50/70 font-semibold")}>
      <td className={cn("px-5 py-3", indent && "pl-9")}>
        <p
          className={cn(
            "text-slate-900",
            tone === "muted" && "text-slate-600",
            tone === "negative" && "text-rose-800",
          )}
        >
          {label}
        </p>
        <p className="text-[11px] font-normal text-slate-400">{note}</p>
      </td>
      <td
        className={cn(
          "px-5 py-3 text-right whitespace-nowrap tabular-nums",
          emphasis === "subtotal" ? "font-bold text-slate-950" : "font-semibold text-slate-800",
          tone === "muted" && "font-medium text-slate-600",
          tone === "negative" && "text-rose-700",
        )}
      >
        {amount}
      </td>
    </tr>
  );
}
