"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ExportExcelButton } from "@/app/admin/inventory/_components/excel-actions";
import type { CouponReport, CouponReportRow } from "@/lib/admin/coupons";
import {
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  periodChange,
  previousRange,
  type DeliveryReport,
  type TrendReport,
} from "@/lib/admin/reports";
import { downloadCouponReport, fetchCouponReport } from "@/lib/mart-api/coupons";
import { MartApiError } from "@/lib/mart-api/products";
import { fetchDelivery, fetchTrend } from "@/lib/mart-api/reports";
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
import { ReportTable, sortRows, type ReportColumn } from "./report-table";
import { SalesTrendChart } from "./trend-chart";

export function DeliveryCouponsReportView() {
  const query = useReportQuery();
  const [reload, setReload] = useState(0);
  const [sortCol, setSortCol] = useState("totalSales");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [state, setState] = useState<{
    key: string;
    delivery: DeliveryReport | null;
    prevDelivery: DeliveryReport | null;
    trend: TrendReport | null;
    coupons: CouponReport | null;
    error: string;
  }>({
    key: "",
    delivery: null,
    prevDelivery: null,
    trend: null,
    coupons: null,
    error: "",
  });

  useEffect(() => {
    if (query.queryError) return;
    let active = true;
    const prev =
      query.window && previousRange(query.window.from, query.window.to);
    const prevCall = prev
      ? { ...query.call, preset: null, from: prev.from, to: prev.to }
      : null;

    Promise.all([
      fetchDelivery(query.call, query.now),
      prevCall ? fetchDelivery(prevCall, query.now).catch(() => null) : Promise.resolve(null),
      fetchTrend(query.call, query.now).catch(() => null),
      fetchCouponReport(query.call, query.now),
    ])
      .then(([delivery, prevDelivery, trend, coupons]) => {
        if (active) {
          setState({
            key: query.requestKey,
            delivery,
            prevDelivery,
            trend,
            coupons,
            error: "",
          });
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          key: query.requestKey,
          delivery: null,
          prevDelivery: null,
          trend: null,
          coupons: null,
          error:
            error instanceof MartApiError
              ? error.message
              : "Could not load delivery, returns, and coupon analytics.",
        });
      });
    return () => {
      active = false;
    };
  }, [query.call, query.now, query.queryError, query.requestKey, query.window, reload]);

  const loading = !query.queryError && state.key !== query.requestKey;
  const delivery = state.key === query.requestKey ? state.delivery : null;
  const prevDelivery = state.key === query.requestKey ? state.prevDelivery : null;
  const trend = state.key === query.requestKey ? state.trend : null;
  const coupons = state.key === query.requestKey ? state.coupons : null;
  const error = state.key === query.requestKey ? state.error : "";

  const couponColumns = useMemo<ReportColumn<CouponReportRow>[]>(
    () => [
      {
        id: "code",
        label: "Coupon Code",
        sortValue: (row) => row.code,
        render: (row) => (
          <Link
            href={`/admin/coupons/${row.couponId}`}
            className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 hover:bg-teal-50 hover:text-[#0b3d39]"
          >
            {row.code}
          </Link>
        ),
      },
      {
        id: "timesUsed",
        label: "Uses",
        align: "right",
        sortValue: (row) => row.timesUsed,
        render: (row) => (
          <span className="font-semibold text-slate-900">{formatReportCount(row.timesUsed)}</span>
        ),
      },
      {
        id: "totalDiscount",
        label: "Discount Given",
        align: "right",
        sortValue: (row) => row.totalDiscount,
        render: (row) => (
          <span className="font-semibold text-rose-700">
            −{formatReportMoney(row.totalDiscount)}
          </span>
        ),
      },
      {
        id: "totalSales",
        label: "Net Sales Driven",
        align: "right",
        sortValue: (row) => row.totalSales,
        render: (row) => (
          <span className="font-semibold text-slate-950">
            {formatReportMoney(row.totalSales)}
          </span>
        ),
      },
      {
        id: "avgDiscount",
        label: "Avg Discount / Use",
        align: "right",
        sortValue: (row) => (row.timesUsed > 0 ? row.totalDiscount / row.timesUsed : 0),
        render: (row) =>
          formatReportMoney(
            row.timesUsed > 0 ? Math.round((row.totalDiscount / row.timesUsed) * 100) / 100 : 0,
          ),
      },
      {
        id: "discountImpact",
        label: "Discount % of Sales",
        align: "right",
        sortValue: (row) =>
          row.totalSales + row.totalDiscount > 0
            ? (row.totalDiscount / (row.totalSales + row.totalDiscount)) * 100
            : 0,
        render: (row) => {
          const gross = row.totalSales + row.totalDiscount;
          const pct = gross > 0 ? Math.round((row.totalDiscount / gross) * 1000) / 10 : 0;
          return <span className="text-slate-600">{formatReportPercent(pct)}</span>;
        },
      },
      {
        id: "roi",
        label: "Sales / ৳1 Discount",
        align: "right",
        sortValue: (row) => (row.totalDiscount > 0 ? row.totalSales / row.totalDiscount : null),
        render: (row) =>
          row.totalDiscount > 0 ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
              {(row.totalSales / row.totalDiscount).toFixed(1)}×
            </span>
          ) : (
            <span className="text-xs text-slate-400">Free delivery</span>
          ),
      },
    ],
    [],
  );

  const sortedCoupons = useMemo(
    () => sortRows(coupons?.items ?? [], couponColumns, sortCol, direction),
    [coupons?.items, couponColumns, sortCol, direction],
  );

  function handleSort(columnId: string) {
    if (sortCol === columnId) setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortCol(columnId);
      setDirection("desc");
    }
  }

  const totalOutcomes = delivery
    ? delivery.delivered + delivery.returned + delivery.cancelled
    : 0;
  const deliveredPct =
    totalOutcomes > 0 && delivery ? Math.round((delivery.delivered / totalOutcomes) * 1000) / 10 : 0;
  const returnedPct =
    totalOutcomes > 0 && delivery ? Math.round((delivery.returned / totalOutcomes) * 1000) / 10 : 0;
  const cancelledPct =
    totalOutcomes > 0 && delivery ? Math.round((delivery.cancelled / totalOutcomes) * 1000) / 10 : 0;

  const returnRateDelta = periodChange(
    delivery?.returnRatePercent ?? null,
    prevDelivery?.returnRatePercent ?? null,
  );
  const couponRoi =
    coupons && coupons.totalDiscount > 0
      ? `${(coupons.totalSales / coupons.totalDiscount).toFixed(1)}×`
      : "—";

  return (
    <ReportShell
      title="Delivery, Returns & Coupons"
      subtitle="Track fulfilment success, return rates, cancellation impact, and promotional coupon ROI."
      query={query}
      exportKind="delivery"
      exportLabel="Export Delivery Excel"
      extraActions={
        <ExportExcelButton
          label="Export Coupons Excel"
          filename={query.exportFilename("coupons")}
          onExport={() => downloadCouponReport(query.call, query.now)}
        />
      }
      filterNote="Coupon redemptions are counted by order creation time and ignore product/channel filters."
    >
      {loading ? (
        <ReportLoadingSkeleton cards={4} />
      ) : error ? (
        <ReportErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : !delivery ? (
        <ReportEmptyState
          icon="local_shipping"
          title="No fulfilment data available"
          description="No delivered, returned, or cancelled orders were found for this window."
        />
      ) : (
        <div className="space-y-5">
          {/* Delivery & Returns KPI Strip */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Delivered Orders"
              value={formatReportCount(delivery.delivered)}
              icon="check_circle"
              tone="positive"
              hint={`${deliveredPct}% of closed order outcomes`}
            />
            <ReportKpiCard
              label="Returned Orders"
              value={formatReportCount(delivery.returned)}
              icon="assignment_return"
              tone={delivery.returned > 0 ? "negative" : "neutral"}
              hint={`Returned value ${formatReportMoney(delivery.returnedValue ?? 0)}`}
            />
            <ReportKpiCard
              label="Cancelled Orders"
              value={formatReportCount(delivery.cancelled)}
              icon="cancel"
              tone={delivery.cancelled > 0 ? "warning" : "neutral"}
              hint={`${cancelledPct}% of closed outcomes`}
            />
            <ReportKpiCard
              label="Return Rate"
              value={formatReportPercent(delivery.returnRatePercent)}
              icon="percent"
              tone={
                delivery.returnRatePercent == null
                  ? "neutral"
                  : delivery.returnRatePercent > 10
                    ? "negative"
                    : "positive"
              }
              badge={
                returnRateDelta.direction && returnRateDelta.text !== "—" ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                      returnRateDelta.direction === "up"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {returnRateDelta.direction === "up" ? "↑" : "↓"} {returnRateDelta.text} vs prev
                  </span>
                ) : null
              }
              hint="Returned ÷ delivered × 100"
            />
          </section>

          {/* Fulfillment Outcomes Visual Bar + Sales/Profit Trend */}
          <div className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <ReportSectionCard
              title="Order Outcome Mix"
              subtitle="Delivered vs Returned vs Cancelled ratio."
            >
              {totalOutcomes === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No completed order outcomes in this range.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex h-3.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${deliveredPct}%` }}
                      title={`Delivered: ${deliveredPct}%`}
                    />
                    <div
                      className="bg-rose-500 transition-all"
                      style={{ width: `${returnedPct}%` }}
                      title={`Returned: ${returnedPct}%`}
                    />
                    <div
                      className="bg-amber-400 transition-all"
                      style={{ width: `${cancelledPct}%` }}
                      title={`Cancelled: ${cancelledPct}%`}
                    />
                  </div>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 px-3.5 py-2.5">
                      <dt className="flex items-center gap-2 font-medium text-emerald-950">
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                        Delivered
                      </dt>
                      <dd className="font-bold tabular-nums text-emerald-800">
                        {formatReportCount(delivery.delivered)} ({deliveredPct}%)
                      </dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-rose-50/70 px-3.5 py-2.5">
                      <dt className="flex items-center gap-2 font-medium text-rose-950">
                        <span className="size-2.5 rounded-full bg-rose-500" />
                        Returned
                      </dt>
                      <dd className="font-bold tabular-nums text-rose-800">
                        {formatReportCount(delivery.returned)} ({returnedPct}%)
                      </dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-amber-50/70 px-3.5 py-2.5">
                      <dt className="flex items-center gap-2 font-medium text-amber-950">
                        <span className="size-2.5 rounded-full bg-amber-400" />
                        Cancelled
                      </dt>
                      <dd className="font-bold tabular-nums text-amber-800">
                        {formatReportCount(delivery.cancelled)} ({cancelledPct}%)
                      </dd>
                    </div>
                  </dl>
                  {prevDelivery ? (
                    <p className="text-[11px] text-slate-500">
                      Previous period: {formatReportCount(prevDelivery.delivered)} delivered,{" "}
                      {formatReportCount(prevDelivery.returned)} returned (
                      {formatReportPercent(prevDelivery.returnRatePercent)} rate).
                    </p>
                  ) : null}
                </div>
              )}
            </ReportSectionCard>

            <ReportSectionCard
              title="Realized Sales & Profit Trajectory"
              subtitle="Track how fulfilment and returns impact realized revenue over time."
            >
              {trend ? (
                <SalesTrendChart points={trend.points} grain={trend.grain} />
              ) : (
                <p className="py-12 text-center text-xs text-slate-400">Trend unavailable.</p>
              )}
            </ReportSectionCard>
          </div>

          {/* Coupon ROI Report */}
          <ReportSectionCard
            title="Coupon ROI & Discount Impact"
            subtitle="Active coupon redemptions, discount cost, net sales driven, and revenue generated per ৳1 discounted."
            padded={false}
          >
            {coupons ? (
              <div className="grid gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Coupon Uses</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-slate-950">
                    {formatReportCount(coupons.timesUsed)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Total Discount</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-rose-700">
                    −{formatReportMoney(coupons.totalDiscount)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Net Sales Driven</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[#0b3d39]">
                    {formatReportMoney(coupons.totalSales)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Blended Coupon ROI</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{couponRoi}</p>
                </div>
              </div>
            ) : null}

            {sortedCoupons.length === 0 ? (
              <ReportEmptyState
                icon="confirmation_number"
                title="No coupon redemptions in this period"
                description="When customers redeem active coupons, discount cost and ROI will appear here."
              />
            ) : (
              <>
                <ul className="divide-y divide-slate-100 md:hidden">
                  {sortedCoupons.map((row) => (
                    <li key={row.couponId} className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/admin/coupons/${row.couponId}`}
                          className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-950"
                        >
                          {row.code}
                        </Link>
                        <span className="text-xs font-bold text-emerald-700">
                          {row.totalDiscount > 0
                            ? `${(row.totalSales / row.totalDiscount).toFixed(1)}× ROI`
                            : "Free delivery"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs tabular-nums">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Uses</span>
                          <span className="font-semibold text-slate-900">
                            {formatReportCount(row.timesUsed)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Discount</span>
                          <span className="font-semibold text-rose-700">
                            −{formatReportMoney(row.totalDiscount)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Net Sales</span>
                          <span className="font-semibold text-slate-950">
                            {formatReportMoney(row.totalSales)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden md:block">
                  <ReportTable
                    caption="Coupon ROI report"
                    rows={sortedCoupons}
                    columns={couponColumns}
                    sort={sortCol}
                    direction={direction}
                    onSort={handleSort}
                    rowKey={(row) => row.couponId}
                  />
                </div>
              </>
            )}
          </ReportSectionCard>
        </div>
      )}
    </ReportShell>
  );
}
