"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  type SupplierPerformanceReport,
  type SupplierPerformanceRow,
} from "@/lib/admin/reports";
import { MartApiError } from "@/lib/mart-api/products";
import { fetchSuppliersReport } from "@/lib/mart-api/reports";
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
import { ReportTable, sortRows, type ReportColumn } from "./report-table";

export function SuppliersReportView() {
  const query = useReportQuery();
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("salesRevenue");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [state, setState] = useState<{
    key: string;
    report: SupplierPerformanceReport | null;
    error: string;
  }>({ key: "", report: null, error: "" });

  useEffect(() => {
    if (query.queryError) return;
    let active = true;
    fetchSuppliersReport(query.call, query.now)
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
              : "Could not load supplier performance analytics.",
        });
      });
    return () => {
      active = false;
    };
  }, [query.call, query.now, query.queryError, query.requestKey, reload]);

  const loading = !query.queryError && state.key !== query.requestKey;
  const report = state.key === query.requestKey ? state.report : null;
  const error = state.key === query.requestKey ? state.error : "";

  const filtered = useMemo(() => {
    const items = report?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => row.supplierName.toLowerCase().includes(q));
  }, [report?.items, search]);

  const columns = useMemo<ReportColumn<SupplierPerformanceRow>[]>(
    () => [
      {
        id: "supplierName",
        label: "Supplier",
        sortValue: (row) => row.supplierName,
        render: (row) => (
          <Link
            href={`/admin/inventory/suppliers?q=${encodeURIComponent(row.supplierName)}`}
            className="font-semibold text-slate-950 hover:text-[#0b3d39] hover:underline"
          >
            {row.supplierName}
          </Link>
        ),
      },
      {
        id: "linkedProductsCount",
        label: "Products",
        align: "right",
        sortValue: (row) => row.linkedProductsCount,
        render: (row) => formatReportCount(row.linkedProductsCount),
      },
      {
        id: "purchaseCount",
        label: "Purchases",
        align: "right",
        sortValue: (row) => row.purchaseCount,
        render: (row) => (
          <span>
            {formatReportCount(row.purchaseCount)}{" "}
            <span className="text-xs text-slate-400">({row.totalPurchasedUnits}u)</span>
          </span>
        ),
      },
      {
        id: "totalPurchaseSpend",
        label: "Purchase Spend",
        align: "right",
        sortValue: (row) => row.totalPurchaseSpend,
        render: (row) => formatReportMoney(row.totalPurchaseSpend),
      },
      {
        id: "unitsSold",
        label: "Units Sold",
        align: "right",
        sortValue: (row) => row.unitsSold,
        render: (row) => formatReportCount(row.unitsSold),
      },
      {
        id: "salesRevenue",
        label: "Sales Revenue",
        align: "right",
        sortValue: (row) => row.salesRevenue,
        render: (row) => (
          <span className="font-semibold text-slate-950">
            {formatReportMoney(row.salesRevenue)}
          </span>
        ),
      },
      {
        id: "cogs",
        label: "COGS",
        align: "right",
        sortValue: (row) => row.cogs,
        render: (row) => formatReportMoney(row.cogs),
      },
      {
        id: "netProfit",
        label: "Net Profit",
        align: "right",
        sortValue: (row) => row.netProfit,
        render: (row) => <ProfitPill profit={row.netProfit} />,
      },
      {
        id: "marginPercent",
        label: "Margin %",
        align: "right",
        sortValue: (row) => row.marginPercent,
        render: (row) => (
          <span
            className={cn(
              "font-semibold",
              row.marginPercent == null
                ? "text-slate-400"
                : row.marginPercent < 0
                  ? "text-rose-700"
                  : "text-emerald-700",
            )}
          >
            {formatReportPercent(row.marginPercent)}
          </span>
        ),
      },
      {
        id: "currentStockValue",
        label: "Stock Value",
        align: "right",
        sortValue: (row) => row.currentStockValue,
        render: (row) => (
          <span>
            <span className="font-semibold text-slate-900">
              {formatReportMoney(row.currentStockValue)}
            </span>{" "}
            <span className="text-xs text-slate-400">({row.currentStockUnits}u)</span>
          </span>
        ),
      },
    ],
    [],
  );

  const sorted = useMemo(
    () => sortRows(filtered, columns, sortCol, direction),
    [filtered, columns, sortCol, direction],
  );

  function handleSort(columnId: string) {
    if (sortCol === columnId) setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortCol(columnId);
      setDirection("desc");
    }
  }

  return (
    <ReportShell
      title="Supplier Performance Report"
      subtitle="Evaluate supplier procurement spend, linked product sales, COGS, net profit, margins, and remaining stock capital."
      query={query}
      exportKind="suppliers"
      exportLabel="Export Suppliers Excel"
      showProduct={false}
    >
      {loading ? (
        <ReportLoadingSkeleton cards={4} />
      ) : error ? (
        <ReportErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : !report ? (
        <ReportEmptyState
          icon="handshake"
          title="No supplier data available"
          description="Link products to suppliers or record purchases to track supplier profitability."
        />
      ) : (
        <div className="space-y-5">
          {/* Top Supplier KPI Strip */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Total Purchase Spend"
              value={formatReportMoney(report.totalPurchaseSpend)}
              icon="local_mall"
              hint={`${formatReportCount(report.items.length)} suppliers in report`}
            />
            <ReportKpiCard
              label="Supplier Sales Revenue"
              value={formatReportMoney(report.totalSalesRevenue)}
              icon="payments"
              tone="accent"
              hint="Realized sales on supplier-linked products"
            />
            <ReportKpiCard
              label="Total COGS"
              value={formatReportMoney(report.totalCogs)}
              icon="inventory"
              hint="Known-cost goods sold"
            />
            <ReportKpiCard
              label="Supplier Net Profit"
              value={formatReportMoney(report.totalNetProfit)}
              icon="trending_up"
              tone={
                report.totalNetProfit == null
                  ? "neutral"
                  : report.totalNetProfit < 0
                    ? "negative"
                    : "positive"
              }
              hint="Net profit across supplier-linked items"
            />
          </section>

          <ReportSectionCard
            title="Supplier Breakdown"
            subtitle="Click any column header to sort by spend, revenue, profit, margin, or stock value."
            padded={false}
            action={
              <label className="relative print:hidden">
                <MaterialIcon
                  name="search"
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[16px] text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search supplier name…"
                  aria-label="Search suppliers"
                  className="h-8 w-52 rounded-lg border border-slate-200 bg-white pr-2.5 pl-8 text-xs outline-none focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
                />
              </label>
            }
          >
            {sorted.length === 0 ? (
              <ReportEmptyState
                icon="handshake"
                title="No suppliers matched"
                description="Add suppliers under Inventory → Suppliers and assign them to products or purchases."
              />
            ) : (
              <>
                <ul className="divide-y divide-slate-100 lg:hidden">
                  {sorted.map((row) => (
                    <li key={row.supplierId} className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/admin/inventory/suppliers?q=${encodeURIComponent(row.supplierName)}`}
                            className="text-sm font-bold text-slate-950 hover:text-[#0b3d39]"
                          >
                            {row.supplierName}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {row.linkedProductsCount} products · {row.purchaseCount} purchases
                          </p>
                        </div>
                        <ProfitPill
                          profit={row.netProfit}
                          marginPercent={row.marginPercent}
                          showMargin
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs tabular-nums">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Spend</span>
                          <span className="font-semibold text-slate-900">
                            {formatReportMoney(row.totalPurchaseSpend)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Revenue</span>
                          <span className="font-semibold text-slate-950">
                            {formatReportMoney(row.salesRevenue)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Stock Val</span>
                          <span className="font-semibold text-slate-700">
                            {formatReportMoney(row.currentStockValue)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden lg:block">
                  <ReportTable
                    caption="Supplier performance report"
                    rows={sorted}
                    columns={columns}
                    sort={sortCol}
                    direction={direction}
                    onSort={handleSort}
                    rowKey={(row) => row.supplierId}
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
