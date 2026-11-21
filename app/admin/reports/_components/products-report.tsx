"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { InventoryPager } from "@/app/admin/inventory/_components/pager";
import {
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  type ProductReportRow,
  type ReportProfitFilter,
} from "@/lib/admin/reports";
import { MartApiError } from "@/lib/mart-api/products";
import { fetchProductRows } from "@/lib/mart-api/reports";
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

const PROFIT_FILTER_PILLS: Array<{ id: ReportProfitFilter; label: string; tone: string }> = [
  { id: "all", label: "All Products", tone: "bg-[#0b3d39] text-white" },
  { id: "profit", label: "Profitable", tone: "bg-emerald-700 text-white" },
  { id: "loss", label: "Loss-Making", tone: "bg-rose-700 text-white" },
  { id: "unknown_cost", label: "Missing Cost", tone: "bg-amber-700 text-white" },
];

const PAGE_SIZE = 20;

export function ProductsReportView() {
  const query = useReportQuery();
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>(query.sort ?? "revenue");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<{
    key: string;
    items: ProductReportRow[];
    total: number;
    truncated: boolean;
    error: string;
  }>({ key: "", items: [], total: 0, truncated: false, error: "" });

  useEffect(() => {
    if (query.queryError) return;
    let active = true;
    fetchProductRows(query.call, query.now)
      .then((result) => {
        if (!active) return;
        setPage(1);
        setState({
          key: query.requestKey,
          items: result.items,
          total: result.total,
          truncated: result.truncated,
          error: "",
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          key: query.requestKey,
          items: [],
          total: 0,
          truncated: false,
          error:
            error instanceof MartApiError
              ? error.message
              : "Could not load the product profitability report.",
        });
      });
    return () => {
      active = false;
    };
  }, [query.call, query.now, query.queryError, query.requestKey, reload]);

  const loading = !query.queryError && state.key !== query.requestKey;
  const items = useMemo(
    () => (state.key === query.requestKey ? state.items : []),
    [state.key, state.items, query.requestKey],
  );
  const error = state.key === query.requestKey ? state.error : "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        (row.sku ?? "").toLowerCase().includes(q) ||
        (row.supplierName ?? "").toLowerCase().includes(q) ||
        (row.categoryName ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const columns = useMemo<ReportColumn<ProductReportRow>[]>(
    () => [
      {
        id: "title",
        label: "Product",
        sortValue: (row) => row.title,
        render: (row) => (
          <div className="min-w-[12rem] max-w-[18rem]">
            {row.productId ? (
              <Link
                href={`/admin/products/${row.productId}/view`}
                className="block truncate font-semibold text-slate-950 hover:text-[#0b3d39] hover:underline"
              >
                {row.title}
              </Link>
            ) : (
              <span className="block truncate font-semibold text-slate-700">{row.title}</span>
            )}
            <span className="block truncate text-[11px] text-slate-400">
              {row.sku || row.slug || "—"}
            </span>
          </div>
        ),
      },
      {
        id: "supplier",
        label: "Supplier",
        sortValue: (row) => row.supplierName ?? "",
        render: (row) => (
          <span className="text-xs text-slate-600">{row.supplierName || "—"}</span>
        ),
      },
      {
        id: "category",
        label: "Category",
        sortValue: (row) => row.categoryName ?? "",
        render: (row) => (
          <span className="text-xs text-slate-600">{row.categoryName || "—"}</span>
        ),
      },
      {
        id: "units_sold",
        label: "Qty Sold",
        align: "right",
        sortValue: (row) => row.unitsSold,
        render: (row) => (
          <span className="font-semibold text-slate-900">{formatReportCount(row.unitsSold)}</span>
        ),
      },
      {
        id: "avg_selling",
        label: "Avg Sell",
        align: "right",
        sortValue: (row) => row.avgSellingPrice ?? null,
        render: (row) => formatReportMoney(row.avgSellingPrice),
      },
      {
        id: "avg_cost",
        label: "Avg Cost",
        align: "right",
        sortValue: (row) => row.unitCostAvg ?? row.currentCostPrice ?? null,
        render: (row) => formatReportMoney(row.unitCostAvg ?? row.currentCostPrice),
      },
      {
        id: "revenue",
        label: "Revenue",
        align: "right",
        sortValue: (row) => row.revenue,
        render: (row) => (
          <span className="font-semibold text-slate-950">{formatReportMoney(row.revenue)}</span>
        ),
      },
      {
        id: "cost",
        label: "Total Cost",
        align: "right",
        sortValue: (row) => row.cost,
        render: (row) => formatReportMoney(row.cost),
      },
      {
        id: "profit",
        label: "Profit / Loss",
        align: "right",
        sortValue: (row) => row.profit,
        render: (row) => <ProfitPill profit={row.profit} />,
      },
      {
        id: "margin",
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
        id: "returns",
        label: "Returns",
        align: "right",
        sortValue: (row) => row.returnedUnits ?? row.returnCount,
        render: (row) => (
          <span className={cn(row.returnCount > 0 ? "font-semibold text-rose-700" : "text-slate-500")}>
            {formatReportCount(row.returnCount)}
            {(row.returnedUnits ?? 0) > 0 ? ` (${row.returnedUnits}u)` : ""}
          </span>
        ),
      },
      {
        id: "stock",
        label: "On-Hand",
        align: "right",
        sortValue: (row) => row.currentStock ?? -1,
        render: (row) =>
          row.currentStock == null ? (
            <span className="text-xs text-slate-400">Unlimited</span>
          ) : (
            formatReportCount(row.currentStock)
          ),
      },
      {
        id: "stock_value",
        label: "Stock Value",
        align: "right",
        sortValue: (row) => row.stockValue ?? null,
        render: (row) => formatReportMoney(row.stockValue),
      },
    ],
    [],
  );

  const sorted = useMemo(
    () => sortRows(filtered, columns, sortCol, direction),
    [filtered, columns, sortCol, direction],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totals = useMemo(() => {
    let units = 0;
    let revenue = 0;
    let cost = 0;
    let hasCost = false;
    let profit = 0;
    let hasProfit = false;
    for (const row of filtered) {
      units += row.unitsSold;
      revenue += row.revenue;
      if (row.cost != null) {
        cost += row.cost;
        hasCost = true;
      }
      if (row.profit != null) {
        profit += row.profit;
        hasProfit = true;
      }
    }
    return {
      units,
      revenue,
      cost: hasCost ? cost : null,
      profit: hasProfit ? profit : null,
    };
  }, [filtered]);

  function handleSort(columnId: string) {
    if (sortCol === columnId) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(columnId);
      setDirection("desc");
    }
    setPage(1);
  }

  return (
    <ReportShell
      title="Product Profitability & Sales"
      subtitle="Compare revenue, average selling price, cost, net profit/loss, margin %, returns, and current stock value per product."
      query={query}
      exportKind="products"
      exportLabel="Export Products Excel"
    >
      {loading ? (
        <ReportLoadingSkeleton cards={4} />
      ) : error ? (
        <ReportErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : (
        <div className="space-y-5">
          {/* Summary Strip */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Matched Products"
              value={formatReportCount(filtered.length)}
              icon="inventory_2"
              hint={`${formatReportCount(totals.units)} units sold in period`}
            />
            <ReportKpiCard
              label="Total Revenue"
              value={formatReportMoney(totals.revenue)}
              icon="payments"
              tone="accent"
              hint="Realized net merchandise revenue"
            />
            <ReportKpiCard
              label="Total Cost (COGS)"
              value={formatReportMoney(totals.cost)}
              icon="shopping_cart"
              hint="Known-cost items only"
            />
            <ReportKpiCard
              label="Net Profit / Loss"
              value={formatReportMoney(totals.profit)}
              icon="trending_up"
              tone={
                totals.profit == null
                  ? "neutral"
                  : totals.profit < 0
                    ? "negative"
                    : "positive"
              }
              hint="Across matched products"
            />
          </section>

          {/* Profit Filter Pills + Search */}
          <ReportSectionCard
            title="Product Breakdown"
            subtitle={
              state.truncated
                ? `Showing first ${items.length} of ${state.total} products. Export Excel for the complete sheet.`
                : `${formatReportCount(filtered.length)} products matching active filters.`
            }
            padded={false}
            action={
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Profitability filter">
                  {PROFIT_FILTER_PILLS.map((pill) => {
                    const active = query.profitFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => {
                          setPage(1);
                          query.update({
                            profit_filter: pill.id === "all" ? null : pill.id,
                          });
                        }}
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                          active
                            ? pill.tone
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                        )}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>

                <label className="relative">
                  <MaterialIcon
                    name="search"
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[16px] text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Filter title, SKU, supplier…"
                    aria-label="Filter products in table"
                    className="h-8 w-52 rounded-lg border border-slate-200 bg-white pr-2.5 pl-8 text-xs outline-none focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
                  />
                </label>
              </div>
            }
          >
            {visible.length === 0 ? (
              <ReportEmptyState
                icon="inventory_2"
                title="No products match these filters"
                description="Try switching the profitability pill, clearing search text, or widening the date range."
              />
            ) : (
              <>
                {/* Mobile Cards */}
                <ul className="divide-y divide-slate-100 lg:hidden">
                  {visible.map((row, idx) => (
                    <li key={`${row.productId ?? row.title}-${idx}`} className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {row.productId ? (
                            <Link
                              href={`/admin/products/${row.productId}/view`}
                              className="block truncate text-sm font-bold text-slate-950 hover:text-[#0b3d39]"
                            >
                              {row.title}
                            </Link>
                          ) : (
                            <p className="truncate text-sm font-bold text-slate-950">{row.title}</p>
                          )}
                          <p className="text-xs text-slate-500">
                            {row.categoryName || "Uncategorized"}
                            {row.supplierName ? ` · ${row.supplierName}` : ""}
                          </p>
                        </div>
                        <ProfitPill profit={row.profit} marginPercent={row.marginPercent} showMargin />
                      </div>
                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs tabular-nums">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Qty / Rev</span>
                          <span className="font-semibold text-slate-900">
                            {row.unitsSold} · {formatReportMoney(row.revenue)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">COGS</span>
                          <span className="font-semibold text-slate-700">
                            {formatReportMoney(row.cost)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Stock / Val</span>
                          <span className="font-semibold text-slate-700">
                            {row.currentStock ?? "∞"} · {formatReportMoney(row.stockValue)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Desktop Sortable Table */}
                <div className="hidden lg:block">
                  <ReportTable
                    caption="Product profitability and sales report"
                    rows={visible}
                    columns={columns}
                    sort={sortCol}
                    direction={direction}
                    onSort={handleSort}
                    rowKey={(row) => row.productId ?? `${row.title}-${row.sku ?? ""}`}
                  />
                </div>

                {totalPages > 1 ? (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <InventoryPager
                      page={safePage}
                      pages={totalPages}
                      total={sorted.length}
                      pageSize={PAGE_SIZE}
                      onPage={setPage}
                    />
                  </div>
                ) : null}
              </>
            )}
          </ReportSectionCard>
        </div>
      )}
    </ReportShell>
  );
}
