"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { ExportExcelButton } from "@/app/admin/inventory/_components/excel-actions";
import { InventoryPager } from "@/app/admin/inventory/_components/pager";
import {
  formatReportCount,
  formatReportMoney,
  type MovementReport,
  type StockReport,
  type StockRow,
} from "@/lib/admin/reports";
import { MartApiError } from "@/lib/mart-api/products";
import {
  downloadReportExport,
  fetchMovements,
  fetchStockRows,
} from "@/lib/mart-api/reports";
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

type StockTab = "all" | "low" | "dead" | "missing_cost";

const PAGE_SIZE = 20;

export function InventoryReportView() {
  const query = useReportQuery();
  const [reload, setReload] = useState(0);
  const [tab, setTab] = useState<StockTab>("all");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("stockValue");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [state, setState] = useState<{
    key: string;
    report: StockReport | null;
    items: StockRow[];
    truncated: boolean;
    movements: MovementReport | null;
    error: string;
  }>({
    key: "",
    report: null,
    items: [],
    truncated: false,
    movements: null,
    error: "",
  });

  useEffect(() => {
    if (query.queryError) return;
    let active = true;
    Promise.all([
      fetchStockRows(query.call, query.now),
      fetchMovements(query.call, query.now),
    ])
      .then(([stockData, movements]) => {
        if (!active) return;
        setPage(1);
        setState({
          key: query.requestKey,
          report: stockData.report,
          items: stockData.items,
          truncated: stockData.truncated,
          movements,
          error: "",
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          key: query.requestKey,
          report: null,
          items: [],
          truncated: false,
          movements: null,
          error:
            error instanceof MartApiError
              ? error.message
              : "Could not load inventory valuation & stock movements.",
        });
      });
    return () => {
      active = false;
    };
  }, [query.call, query.now, query.queryError, query.requestKey, reload]);

  const loading = !query.queryError && state.key !== query.requestKey;
  const report = state.key === query.requestKey ? state.report : null;
  const items = useMemo(
    () => (state.key === query.requestKey ? state.items : []),
    [state.key, state.items, query.requestKey],
  );
  const movements = state.key === query.requestKey ? state.movements : null;
  const error = state.key === query.requestKey ? state.error : "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (tab === "low" && !row.lowStock) return false;
      if (tab === "dead" && !row.noSale30d) return false;
      if (tab === "missing_cost" && row.costPrice != null) return false;
      if (q) {
        return (
          row.title.toLowerCase().includes(q) ||
          (row.supplierName ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, tab, search]);

  const columns = useMemo<ReportColumn<StockRow>[]>(
    () => [
      {
        id: "title",
        label: "Product",
        sortValue: (row) => row.title,
        render: (row) => (
          <div className="min-w-[12rem] max-w-[20rem]">
            <Link
              href={`/admin/products/${row.productId}/view`}
              className="block truncate font-semibold text-slate-950 hover:text-[#0b3d39] hover:underline"
            >
              {row.title}
            </Link>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {row.lowStock ? (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  Low stock
                </span>
              ) : null}
              {row.noSale30d ? (
                <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                  30d no sale
                </span>
              ) : null}
              {row.costPrice == null ? (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  No cost
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "supplier",
        label: "Supplier",
        sortValue: (row) => row.supplierName ?? "",
        render: (row) => <span className="text-xs text-slate-600">{row.supplierName || "—"}</span>,
      },
      {
        id: "quantity",
        label: "On Hand",
        align: "right",
        sortValue: (row) => row.quantity ?? -1,
        render: (row) =>
          row.quantity == null ? (
            <span className="text-xs text-slate-400">Unlimited</span>
          ) : (
            <span
              className={cn(
                "font-semibold",
                row.lowStock ? "text-amber-700" : "text-slate-950",
              )}
            >
              {formatReportCount(row.quantity)}
            </span>
          ),
      },
      {
        id: "sellingPrice",
        label: "Sell Price",
        align: "right",
        sortValue: (row) => row.sellingPrice ?? null,
        render: (row) => formatReportMoney(row.sellingPrice),
      },
      {
        id: "costPrice",
        label: "Cost Price",
        align: "right",
        sortValue: (row) => row.costPrice,
        render: (row) => formatReportMoney(row.costPrice),
      },
      {
        id: "stockValue",
        label: "Stock Cost Value",
        align: "right",
        sortValue: (row) => row.stockValue,
        render: (row) => (
          <span className="font-semibold text-slate-950">{formatReportMoney(row.stockValue)}</span>
        ),
      },
      {
        id: "potentialRetail",
        label: "Retail Value",
        align: "right",
        sortValue: (row) => row.potentialRetailValue ?? null,
        render: (row) => formatReportMoney(row.potentialRetailValue),
      },
      {
        id: "expectedProfit",
        label: "Expected Profit",
        align: "right",
        sortValue: (row) => row.expectedProfitOnHand ?? null,
        render: (row) => (
          <span
            className={cn(
              "font-semibold",
              (row.expectedProfitOnHand ?? 0) < 0 ? "text-rose-700" : "text-emerald-700",
            )}
          >
            {formatReportMoney(row.expectedProfitOnHand)}
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
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSort(columnId: string) {
    if (sortCol === columnId) setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortCol(columnId);
      setDirection("desc");
    }
    setPage(1);
  }

  const summary = report?.summary ?? null;
  const computedClosing = movements
    ? movements.openingBalance +
      movements.opening +
      movements.purchase +
      movements.sale +
      movements.returnTotal +
      movements.cancel +
      movements.adjustment
    : 0;
  const ledgerBalanced = movements ? computedClosing === movements.closing : true;

  return (
    <ReportShell
      title="Inventory & Stock Valuation"
      subtitle="Live stock capital value, potential retail value, low & dead stock alerts, and immutable stock ledger reconciliation."
      query={query}
      exportKind="stock"
      exportLabel="Export Stock Excel"
      showOrigin={false}
      extraActions={
        <ExportExcelButton
          label="Export Movements Excel"
          filename={query.exportFilename("movements")}
          onExport={() => downloadReportExport("movements", query.call, query.now)}
        />
      }
      filterNote="On-hand valuation reflects live current stock as of today. Stock Movement Reconciliation uses the selected date range."
    >
      {loading ? (
        <ReportLoadingSkeleton cards={4} />
      ) : error ? (
        <ReportErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />
      ) : !summary ? (
        <ReportEmptyState
          icon="warehouse"
          title="No inventory valuation available"
          description="Try clearing category, supplier, or product filters."
        />
      ) : (
        <div className="space-y-5">
          {/* Valuation KPI Strip */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
              label="Total Stock Units"
              value={formatReportCount(summary.unitsOnHand)}
              icon="inventory_2"
              hint={`${formatReportCount(summary.productCount)} tracked products · ${formatReportCount(summary.lowStockCount)} low stock (≤${summary.lowStockAt})`}
            />
            <ReportKpiCard
              label="Total Stock Cost Value"
              value={formatReportMoney(summary.stockValue)}
              icon="account_balance_wallet"
              tone="accent"
              hint={`${formatReportCount(summary.missingCostCount ?? 0)} products missing cost (${formatReportCount(summary.unknownCostUnits)}u)`}
            />
            <ReportKpiCard
              label="Potential Retail Value"
              value={formatReportMoney(summary.potentialRetailValue ?? 0)}
              icon="storefront"
              hint="Current on-hand units × selling price"
            />
            <ReportKpiCard
              label="Expected Profit on Hand"
              value={formatReportMoney(summary.expectedProfitOnHand ?? 0)}
              icon="trending_up"
              tone={(summary.expectedProfitOnHand ?? 0) < 0 ? "negative" : "positive"}
              hint={`${formatReportCount(summary.noSale30dCount)} dead-stock products (30d no sale)`}
            />
          </section>

          {/* Stock Movement Reconciliation Card */}
          {movements ? (
            <ReportSectionCard
              title="Stock Movement Reconciliation"
              subtitle={`Immutable ledger identity for ${query.rangeLabel}: Opening + Purchase + Sale + Return + Cancel ± Adjustment = Closing.`}
              action={
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    ledgerBalanced
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
                  )}
                >
                  <MaterialIcon
                    name={ledgerBalanced ? "verified" : "warning"}
                    className="text-[15px]"
                  />
                  {ledgerBalanced ? "Ledger Balanced" : "Check Variance"}
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
                <MovementTile label="Opening Bal." value={movements.openingBalance} neutral />
                <MovementTile label="Opening Entry" value={movements.opening} />
                <MovementTile label="Purchases" value={movements.purchase} />
                <MovementTile label="Sales" value={movements.sale} />
                <MovementTile label="Returns" value={movements.returnTotal} />
                <MovementTile label="Cancels" value={movements.cancel} />
                <MovementTile label="Adjustments" value={movements.adjustment} />
                <MovementTile label="Closing Stock" value={movements.closing} highlight />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="tabular-nums">
                  Equation: {movements.openingBalance} + {movements.opening} + {movements.purchase}{" "}
                  {movements.sale < 0 ? `− ${Math.abs(movements.sale)}` : `+ ${movements.sale}`} +{" "}
                  {movements.returnTotal} + {movements.cancel}{" "}
                  {movements.adjustment < 0
                    ? `− ${Math.abs(movements.adjustment)}`
                    : `+ ${movements.adjustment}`}{" "}
                  = <strong className="text-slate-900">{movements.closing}</strong>
                </span>
                <Link
                  href="/admin/inventory/stock"
                  className="font-semibold text-[#0b3d39] hover:underline"
                >
                  Open full stock history →
                </Link>
              </div>
            </ReportSectionCard>
          ) : null}

          {/* Tabbed Inventory Valuation Table */}
          <ReportSectionCard
            title="Stock Valuation & Health"
            subtitle={`As of ${report?.asOf ?? "today"} · Dead stock checked since ${report?.noSaleSince ?? "30 days ago"}.`}
            padded={false}
            action={
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Inventory health tabs">
                  {(
                    [
                      { id: "all", label: `All (${items.length})` },
                      { id: "low", label: `Low Stock (${summary.lowStockCount})` },
                      { id: "dead", label: `Dead Stock 30d (${summary.noSale30dCount})` },
                      {
                        id: "missing_cost",
                        label: `Missing Cost (${summary.missingCostCount ?? 0})`,
                      },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.id}
                      onClick={() => {
                        setTab(item.id);
                        setPage(1);
                      }}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                        tab === item.id
                          ? "bg-[#0b3d39] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
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
                    placeholder="Filter product or supplier…"
                    aria-label="Filter stock rows"
                    className="h-8 w-52 rounded-lg border border-slate-200 bg-white pr-2.5 pl-8 text-xs outline-none focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
                  />
                </label>
              </div>
            }
          >
            {visible.length === 0 ? (
              <ReportEmptyState
                icon="warehouse"
                title="No matching stock rows"
                description="No products fall into this inventory bucket for the current filters."
              />
            ) : (
              <>
                <ul className="divide-y divide-slate-100 lg:hidden">
                  {visible.map((row) => (
                    <li key={row.productId} className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/products/${row.productId}/view`}
                          className="truncate text-sm font-bold text-slate-950 hover:text-[#0b3d39]"
                        >
                          {row.title}
                        </Link>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-slate-900">
                          {row.quantity == null ? "Unlimited" : `${row.quantity} units`}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs tabular-nums">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Cost Val</span>
                          <span className="font-semibold text-slate-900">
                            {formatReportMoney(row.stockValue)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Retail Val</span>
                          <span className="font-semibold text-slate-700">
                            {formatReportMoney(row.potentialRetailValue)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Exp. Profit</span>
                          <span className="font-semibold text-emerald-700">
                            {formatReportMoney(row.expectedProfitOnHand)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden lg:block">
                  <ReportTable
                    caption="Inventory stock valuation"
                    rows={visible}
                    columns={columns}
                    sort={sortCol}
                    direction={direction}
                    onSort={handleSort}
                    rowKey={(row) => row.productId}
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

function MovementTile({
  label,
  value,
  neutral = false,
  highlight = false,
}: {
  label: string;
  value: number;
  neutral?: boolean;
  highlight?: boolean;
}) {
  const formatted =
    neutral || highlight ? formatReportCount(value) : value > 0 ? `+${formatReportCount(value)}` : formatReportCount(value);
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-center",
        highlight
          ? "border-[#2bc0b5]/50 bg-teal-50/70"
          : "border-slate-200/80 bg-slate-50/60",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-base font-bold tabular-nums",
          highlight
            ? "text-[#0b3d39]"
            : neutral || value === 0
              ? "text-slate-900"
              : value > 0
                ? "text-emerald-700"
                : "text-rose-700",
        )}
      >
        {formatted}
      </p>
    </div>
  );
}
