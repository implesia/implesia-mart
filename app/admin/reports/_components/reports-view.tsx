"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { ExportExcelButton } from "@/app/admin/inventory/_components/excel-actions";
import { InventoryPager } from "@/app/admin/inventory/_components/pager";
import {
  AdminEmpty,
  AdminNotice,
  adminButtonClass,
  adminFieldClass,
} from "@/app/admin/_components/admin-ui";
import {
  REPORT_PRESETS,
  ReportQueryError,
  formatRangeLabel,
  formatReportCount,
  formatReportMoney,
  formatReportPercent,
  periodChange,
  resolveReportCall,
  type ReportCall,
  type ReportPreset,
} from "@/lib/admin/reports";
import type { CouponReportRow } from "@/lib/admin/coupons";
import { downloadCouponReport, fetchCouponReport } from "@/lib/mart-api/coupons";
import {
  downloadReportExport,
  fetchMovements,
  fetchProductRows,
  fetchStockRows,
  loadReportFilterChoices,
  loadReportOverview,
  type ReportOverview,
} from "@/lib/mart-api/reports";
import type { MovementReport, ProductReportRow, StockReport, StockRow } from "@/lib/admin/reports";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { ReportTable, sortRows, type ReportColumn } from "./report-table";
import { SummaryCards, summaryCardsFrom } from "./summary-cards";
import { SalesTrendChart } from "./trend-chart";

const TABS = [
  { id: "products", label: "Products" },
  { id: "stock", label: "Stock" },
  { id: "movements", label: "Stock movement" },
  { id: "delivery", label: "Delivery & Return" },
  { id: "coupons", label: "Coupons" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type Direction = "asc" | "desc";

const PRESET_LABEL: Record<ReportPreset, string> = {
  this_week: "This week",
  this_month: "This month",
  last_month: "Last month",
};

const PAGE_SIZE = 20;

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function isPreset(value: string | null): value is ReportPreset {
  return value === "this_week" || value === "this_month" || value === "last_month";
}

export function ReportsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [now, setNow] = useState(() => new Date());
  const [reload, setReload] = useState(0);
  const [choices, setChoices] = useState<{ products: { id: string; title: string }[]; categories: { id: string; label: string }[] }>({
    products: [],
    categories: [],
  });
  const [overviewState, setOverviewState] = useState<{ key: string; overview: ReportOverview | null; error: string }>({
    key: "",
    overview: null,
    error: "",
  });
  const [tableState, setTableState] = useState<{
    key: string;
    error: string;
    products: ProductReportRow[];
    productTotal: number;
    productTruncated: boolean;
    stock: StockReport | null;
    stockRows: StockRow[];
    stockTruncated: boolean;
    movements: MovementReport | null;
    coupons: CouponReportRow[];
  }>({
    key: "",
    error: "",
    products: [],
    productTotal: 0,
    productTruncated: false,
    stock: null,
    stockRows: [],
    stockTruncated: false,
    movements: null,
    coupons: [],
  });

  const tab: TabId = isTab(params.get("tab")) ? (params.get("tab") as TabId) : "products";
  const queryText = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const sort = params.get("sort") ?? defaultSort(tab);
  const direction: Direction =
    params.get("dir") === "asc" || params.get("dir") === "desc"
      ? (params.get("dir") as Direction)
      : defaultDirection(tab);

  const call = useMemo<ReportCall>(() => {
    const preset = params.get("preset");
    const from = params.get("from");
    const to = params.get("to");
    const empty = !preset && !from && !to;
    return {
      preset: empty ? "this_month" : preset,
      from: empty ? null : from,
      to: empty ? null : to,
      productId: params.get("product_id"),
      categoryId: params.get("category_id"),
      channel: params.get("channel"),
      grain: params.get("grain"),
    };
  }, [params]);

  const validation = useMemo(() => {
    try {
      return { window: resolveReportCall(call, now), message: "" };
    } catch (error) {
      return { window: null, message: error instanceof ReportQueryError ? error.message : "Check the filters." };
    }
  }, [call, now]);

  const overviewKey = validation.window ? `${JSON.stringify(call)}|${now.getTime()}|${reload}` : "";
  const tableKey = validation.window ? `${overviewKey}|${tab}` : "";
  const overview = overviewState.key === overviewKey ? overviewState.overview : null;
  const overviewError = !validation.window ? validation.message : overviewState.key === overviewKey ? overviewState.error : "";
  const overviewLoading = Boolean(validation.window) && overviewState.key !== overviewKey;
  const tableError = tableState.key === tableKey ? tableState.error : "";
  const tableLoading =
    Boolean(validation.window) && (tableState.key !== tableKey || (tab === "delivery" && overviewLoading));
  const products = tableState.key === tableKey ? tableState.products : null;
  const productTotal = tableState.productTotal;
  const productTruncated = tableState.productTruncated;
  const stock = tableState.key === tableKey ? tableState.stock : null;
  const stockRows = tableState.key === tableKey ? tableState.stockRows : null;
  const stockTruncated = tableState.stockTruncated;
  const movements = tableState.key === tableKey ? tableState.movements : null;
  const coupons = tableState.key === tableKey ? tableState.coupons : null;

  function replace(patch: Record<string, string | null>, resetPage = false) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (params.get("preset") || params.get("from") || params.get("to")) return;
    const next = new URLSearchParams(params);
    next.set("preset", "this_month");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    let cancelled = false;
    void loadReportFilterChoices().then((next) => {
      if (!cancelled) setChoices(next);
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    if (!validation.window) return;
    const key = overviewKey;
    let cancelled = false;
    void loadReportOverview(call, now)
      .then((next) => {
        if (!cancelled) setOverviewState({ key, overview: next, error: "" });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setOverviewState({
            key,
            overview: null,
            error: error instanceof MartApiError ? error.message : "Could not load reports.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [call, now, overviewKey, validation.window]);

  useEffect(() => {
    if (!validation.window) return;
    const key = tableKey;
    let cancelled = false;
    const fail = (error: unknown) => {
      if (cancelled) return;
      setTableState((current) => ({
        ...current,
        key,
        error: error instanceof MartApiError ? error.message : "Could not load this table.",
      }));
    };
    const job =
      tab === "products"
        ? fetchProductRows(call, now).then((result) => {
            if (cancelled) return;
            setTableState((current) => ({
              ...current,
              key,
              error: "",
              products: result.items,
              productTotal: result.total,
              productTruncated: result.truncated,
            }));
          })
        : tab === "stock"
          ? fetchStockRows(call, now).then((result) => {
              if (cancelled) return;
              setTableState((current) => ({
                ...current,
                key,
                error: "",
                stock: result.report,
                stockRows: result.items,
                stockTruncated: result.truncated,
              }));
            })
          : tab === "movements"
            ? fetchMovements(call, now).then((result) => {
                if (cancelled) return;
                setTableState((current) => ({ ...current, key, error: "", movements: result }));
              })
            : tab === "coupons" && validation.window
              ? fetchCouponReport(call, now).then((result) => {
                  if (cancelled) return;
                  setTableState((current) => ({ ...current, key, error: "", coupons: result.items }));
                })
            : Promise.resolve().then(() => {
                if (!cancelled) setTableState((current) => ({ ...current, key, error: "" }));
              });
    void job.catch(fail);
    return () => {
      cancelled = true;
    };
  }, [call, now, tab, tableKey, validation.window]);

  const custom = !isPreset(params.get("preset")) && Boolean(params.get("from") || params.get("to") || params.get("preset") === "custom");
  const activePreset = isPreset(params.get("preset")) ? params.get("preset") : null;
  const periodLabel = overview
    ? formatRangeLabel(overview.sales.filters.from, overview.sales.filters.to)
    : validation.window
      ? formatRangeLabel(validation.window.from, validation.window.to)
      : "";
  const previousLabel = overview ? formatRangeLabel(overview.previousFrom, overview.previousTo) : "";

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

  function selectPreset(preset: ReportPreset) {
    replace({ preset, from: null, to: null }, true);
  }

  function selectCustom() {
    const from = overview?.sales.filters.from ?? validation.window?.from ?? "";
    const to = overview?.sales.filters.to ?? validation.window?.to ?? "";
    replace({ preset: null, from, to }, true);
  }

  const channelValue = params.get("channel") ?? "";
  const channelOptions = ["website", ...(channelValue && channelValue !== "website" ? [channelValue] : [])];

  return (
    <div className="reports-page min-w-0 space-y-4 pb-10">
    <style>{PRINT_CSS}</style>
  
    {/* Page Header - Reports & Quick Actions in Same Row */}
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2bc0b5] text-white shadow-sm shadow-[#2bc0b5]/30">
            <MaterialIcon name="analytics" className="text-[20px]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Reports
          </h1>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 sm:pl-11">
          {periodLabel || "Sales, profit, stock, and returns"}
          {previousLabel ? (
            <>
              <span className="mx-0.5 text-slate-300">•</span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/60">
                vs {previousLabel}
              </span>
            </>
          ) : null}
        </p>
      </div>
  
      <div className="flex flex-wrap items-center gap-2 print:hidden" data-print-hide>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          onClick={() => {
            setNow(new Date());
            setReload((value) => value + 1);
          }}
        >
          <MaterialIcon name="refresh" className="text-[16px] text-slate-500" />
          Refresh
        </button>
        <button 
          type="button" 
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#2bc0b5] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24a39a]" 
          onClick={() => window.print()}
        >
          <MaterialIcon name="print" className="text-[16px]" />
          Print
        </button>
      </div>
    </header>
  
    <p className="print-only text-sm text-slate-900">
      Reports · {periodLabel}
      {previousLabel ? ` · compared with ${previousLabel}` : ""} · Asia/Dhaka
    </p>
  
    {/* Filter Bar */}
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-5 print:hidden" data-print-hide>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
        {REPORT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={activePreset === preset}
            onClick={() => selectPreset(preset)}
            className={cn(
              "h-9 rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bc0b5]/40",
              activePreset === preset 
                ? "bg-[#2bc0b5] text-white shadow-sm" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {PRESET_LABEL[preset]}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={custom}
          onClick={selectCustom}
          className={cn(
            "h-9 rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bc0b5]/40",
            custom 
              ? "bg-[#2bc0b5] text-white shadow-sm" 
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          Custom
        </button>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {custom ? (
          <>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              From Date
              <input
                type="date"
                value={params.get("from") ?? ""}
                onChange={(event) => replace({ preset: null, from: event.target.value }, true)}
                className={cn(adminFieldClass, "mt-1.5 h-9 text-sm focus-visible:border-[#2bc0b5] focus-visible:ring-[#2bc0b5]/20")}
              />
            </label>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              To Date
              <input
                type="date"
                value={params.get("to") ?? ""}
                onChange={(event) => replace({ preset: null, to: event.target.value }, true)}
                className={cn(adminFieldClass, "mt-1.5 h-9 text-sm focus-visible:border-[#2bc0b5] focus-visible:ring-[#2bc0b5]/20")}
              />
            </label>
          </>
        ) : null}
        
        {tab === "coupons" ? (
          <p className="self-end text-[11px] font-medium leading-relaxed text-slate-500 sm:col-span-2">
            Product, category, and channel filters do not apply to the coupon report.
          </p>
        ) : (
          <>
            <FilterSelect
              label="Product"
              value={params.get("product_id") ?? ""}
              onChange={(value) => replace({ product_id: value || null }, true)}
              options={choices.products.map((product) => ({ id: product.id, label: product.title }))}
              allLabel="All products"
            />
            <FilterSelect
              label="Category"
              value={params.get("category_id") ?? ""}
              onChange={(value) => replace({ category_id: value || null }, true)}
              options={choices.categories.map((category) => ({ id: category.id, label: category.label }))}
              allLabel="All categories"
            />
            <FilterSelect
              label="Channel"
              value={channelValue}
              onChange={(value) => replace({ channel: value || null }, true)}
              options={channelOptions.map((channel) => ({ id: channel, label: channel === "website" ? "Website" : channel }))}
              allLabel="All channels"
            />
          </>
        )}
      </div>
    </section>
  
    {overviewError ? (
      <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
        {overviewError}
      </p>
    ) : null}
  
    {overviewLoading && !overview ? <CardsSkeleton /> : null}
  
    {overview ? (
      <>
        <SummaryCards cards={cards} />
        
        {overview.profit.unknownCostLines > 0 ? (
          <AdminNotice tone="warning">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
              <span>
                <span className="font-bold">{overview.profit.unknownCostLines.toLocaleString("en-US")}</span> order{" "}
                {overview.profit.unknownCostLines === 1 ? "line has" : "lines have"} no cost price (
                {overview.profit.unknownCostUnits.toLocaleString("en-US")} units,{" "}
                {formatReportMoney(overview.profit.unknownCostRevenue)}). Profit leaves them out.
              </span>
              <Link
                href={params.get("product_id") ? `/admin/products/${params.get("product_id")}` : "/admin/products"}
                className="font-bold underline decoration-amber-300 underline-offset-2 hover:text-amber-950 shrink-0"
              >
                Fix cost prices
              </Link>
            </div>
          </AdminNotice>
        ) : null}
  
        {/* Chart Section */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Net sales and profit</h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                Each point is a {overview.trend.grain} in Asia/Dhaka.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 print:hidden" role="group" aria-label="Chart grain" data-print-hide>
              {(["day", "week", "month"] as const).map((grain) => (
                <button
                  key={grain}
                  type="button"
                  aria-pressed={(params.get("grain") ?? "") === grain}
                  onClick={() => replace({ grain })}
                  className={cn(
                    "h-7 rounded-md px-2.5 text-[11px] font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bc0b5]/40",
                    params.get("grain") === grain
                      ? "bg-[#2bc0b5] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {grain}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={!params.get("grain")}
                onClick={() => replace({ grain: null })}
                className={cn(
                  "h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bc0b5]/40",
                  !params.get("grain") 
                    ? "bg-[#2bc0b5] text-white shadow-sm" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                Auto
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <SalesTrendChart points={overview.trend.points} grain={overview.trend.grain} />
          </div>
        </section>
      </>
    ) : null}
  
    {/* Data Table Section */}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-2 sm:px-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Tab List */}
        <div role="tablist" aria-label="Report tables" className="flex min-w-0 gap-1 overflow-x-auto pb-1 lg:pb-0">
          {TABS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`report-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`report-panel-${item.id}`}
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => replace({ tab: item.id, sort: null, dir: null }, true)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                const step = event.key === "ArrowRight" ? 1 : -1;
                const next = TABS[(index + step + TABS.length) % TABS.length];
                replace({ tab: next.id, sort: null, dir: null }, true);
                document.getElementById(`report-tab-${next.id}`)?.focus();
              }}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bc0b5]/40 rounded-t-md",
                tab === item.id 
                  ? "text-[#2bc0b5] bg-[#2bc0b5]/5" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {item.label}
              {tab === item.id && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-[#2bc0b5]" />
              )}
            </button>
          ))}
        </div>
  
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-2 pb-2 lg:p-0" data-print-hide>
          <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
            <span className="sr-only">Search this table</span>
            <input
              value={queryText}
              onChange={(event) => replace({ q: event.target.value || null }, true)}
              placeholder="Search records..."
              className={cn(adminFieldClass, "h-8 text-xs pl-3 focus-visible:border-[#2bc0b5] focus-visible:ring-[#2bc0b5]/20")}
            />
          </label>
          <ExportExcelButton
            onExport={() =>
              tab === "coupons"
                ? downloadCouponReport(call, now)
                : downloadReportExport(exportKind(tab), call, now)
            }
            filename={`${tab}-${validation.window?.from ?? "report"}-${validation.window?.to ?? "export"}.xlsx`}
          />
          <button 
            type="button" 
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => window.print()}
          >
            <MaterialIcon name="print" className="text-[14px] text-slate-500" />
            Print
          </button>
        </div>
      </div>
  
      <div role="tabpanel" id={`report-panel-${tab}`} aria-labelledby={`report-tab-${tab}`}>
        {tableError ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-100">
              <MaterialIcon name="error" className="text-[20px]" />
            </div>
            <p role="alert" className="mt-3 text-sm font-medium text-rose-700">
              {tableError}
            </p>
          </div>
        ) : tableLoading ? (
          <div className="flex h-64 items-center justify-center bg-slate-50/50" aria-busy="true" aria-label="Loading table">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#2bc0b5]" />
          </div>
        ) : (
          <TabBody
            tab={tab}
            query={queryText}
            sort={sort}
            direction={direction}
            page={page}
            products={products ?? []}
            productTotal={productTotal}
            productTruncated={productTruncated}
            stock={stock}
            stockRows={stockRows ?? []}
            stockTruncated={stockTruncated}
            movements={movements}
            coupons={coupons ?? []}
            delivery={overview?.delivery ?? null}
            onSort={(column) => {
              const nextDir = sort === column && direction === "desc" ? "asc" : sort === column ? "desc" : defaultDirectionFor(column);
              replace({ sort: column, dir: nextDir }, true);
            }}
            onPage={(next) => replace({ page: next <= 1 ? null : String(next) })}
          />
        )}
      </div>
    </section>
    </div>
  );
}

function defaultSort(tab: TabId) {
  if (tab === "products") return "revenue";
  if (tab === "stock") return "quantity";
  if (tab === "movements") return "label";
  if (tab === "coupons") return "uses";
  return "count";
}

function defaultDirection(tab: TabId): Direction {
  if (tab === "products" || tab === "delivery" || tab === "coupons") return "desc";
  return "asc";
}

function defaultDirectionFor(column: string): Direction {
  if (column === "title" || column === "label" || column === "product" || column === "code") return "asc";
  return "desc";
}

function exportKind(tab: TabId) {
  if (tab === "products") return "products" as const;
  if (tab === "stock") return "stock" as const;
  if (tab === "movements") return "movements" as const;
  return "delivery" as const;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
  allLabel: string;
}) {
  const known = options.some((option) => option.id === value);
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-neutral-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={adminFieldClass}>
        <option value="">{allLabel}</option>
        {value && !known ? <option value={value}>{value}</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading summary">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      ))}
    </div>
  );
}

type MovementRow = { id: string; label: string; quantity: number };
type DeliveryRow = { id: string; label: string; count: number | null; display: string };

function TabBody(props: {
  tab: TabId;
  query: string;
  sort: string;
  direction: Direction;
  page: number;
  products: ProductReportRow[];
  productTotal: number;
  productTruncated: boolean;
  stock: StockReport | null;
  stockRows: StockRow[];
  stockTruncated: boolean;
  movements: MovementReport | null;
  coupons: CouponReportRow[];
  delivery: ReportOverview["delivery"] | null;
  onSort: (column: string) => void;
  onPage: (page: number) => void;
}) {
  const needle = props.query.trim().toLowerCase();
  if (props.tab === "products") {
    const columns = productColumns();
    const filtered = props.products.filter((row) => !needle || row.title.toLowerCase().includes(needle));
    return (
      <Paged
        caption="Product sales"
        columns={columns}
        rows={filtered}
        sort={props.sort}
        direction={props.direction}
        page={props.page}
        onSort={props.onSort}
        onPage={props.onPage}
        rowKey={(row) => row.productId ?? row.title}
        empty="No product sales in this period."
        note={
          props.productTruncated
            ? `Showing the first ${props.products.length.toLocaleString("en-US")} of ${props.productTotal.toLocaleString("en-US")} products. Export Excel for the full list.`
            : ""
        }
      />
    );
  }
  if (props.tab === "stock") {
    const columns = stockColumns();
    const filtered = props.stockRows.filter((row) => !needle || row.title.toLowerCase().includes(needle));
    return (
      <>
        {props.stock ? (
          <p className="border-b border-neutral-100 px-4 py-3 text-xs leading-5 text-neutral-600 sm:px-5">
            On hand right now ({props.stock.asOf}), not limited by the date range
            {props.stock.filters.channelApplies ? "" : " or channel"}. Stock value{" "}
            {formatReportMoney(props.stock.summary.stockValue)} · {props.stock.summary.lowStockCount} low (at or below{" "}
            {props.stock.summary.lowStockAt}) · {props.stock.summary.noSale30dCount} with no sale since {props.stock.noSaleSince}.
            {props.stock.summary.unknownCostUnits > 0
              ? ` ${props.stock.summary.unknownCostUnits} units have no cost price.`
              : ""}
          </p>
        ) : null}
        <Paged
          caption="Stock on hand"
          columns={columns}
          rows={filtered}
          sort={props.sort}
          direction={props.direction}
          page={props.page}
          onSort={props.onSort}
          onPage={props.onPage}
          rowKey={(row) => row.productId}
          empty="No products match these filters."
          note={props.stockTruncated ? "Showing the first 1,000 products. Export Excel for the full list." : ""}
        />
      </>
    );
  }
  if (props.tab === "movements" && props.movements) {
    const rows: MovementRow[] = [
      { id: "opening-balance", label: "Opening balance", quantity: props.movements.openingBalance },
      { id: "opening", label: "Opening", quantity: props.movements.opening },
      { id: "purchase", label: "Purchase", quantity: props.movements.purchase },
      { id: "sale", label: "Sale", quantity: props.movements.sale },
      { id: "return", label: "Return", quantity: props.movements.returnTotal },
      { id: "cancel", label: "Cancel", quantity: props.movements.cancel },
      { id: "adjustment", label: "Adjustment", quantity: props.movements.adjustment },
      { id: "closing", label: "Closing", quantity: props.movements.closing },
    ];
    const columns: ReportColumn<MovementRow>[] = [
      { id: "label", label: "Movement", sortValue: (row) => row.label, render: (row) => row.label },
      {
        id: "quantity",
        label: "Quantity",
        align: "right",
        sortValue: (row) => row.quantity,
        render: (row) => formatReportCount(row.quantity),
      },
    ];
    const quiet = rows.every((row) => row.quantity === 0);
    return (
      <>
        <p className="border-b border-neutral-100 px-4 py-3 text-xs leading-5 text-neutral-600 sm:px-5">
          Sale quantities are negative. Closing equals the opening balance plus opening, purchase, sale, return, cancel,
          and adjustment. Channel is not applied.
        </p>
        {quiet ? (
          <AdminEmpty title="No stock movements in this period." />
        ) : (
          <Paged
            caption="Stock movement"
            columns={columns}
            rows={rows.filter((row) => !needle || row.label.toLowerCase().includes(needle))}
            sort={props.sort}
            direction={props.direction}
            page={props.page}
            onSort={props.onSort}
            onPage={props.onPage}
            rowKey={(row) => row.id}
            empty="Nothing in this table matches the search."
          />
        )}
      </>
    );
  }
  if (props.tab === "coupons") {
    const columns: ReportColumn<CouponReportRow>[] = [
      { id: "code", label: "Code", sortValue: (row) => row.code, render: (row) => row.code },
      {
        id: "uses",
        label: "Uses",
        align: "right",
        sortValue: (row) => row.timesUsed,
        render: (row) => formatReportCount(row.timesUsed),
      },
      {
        id: "discount",
        label: "Total discount",
        align: "right",
        sortValue: (row) => row.totalDiscount,
        render: (row) => formatReportMoney(row.totalDiscount),
      },
      {
        id: "sales",
        label: "Total sales",
        align: "right",
        sortValue: (row) => row.totalSales,
        render: (row) => formatReportMoney(row.totalSales),
      },
    ];
    const filtered = props.coupons.filter((row) => !needle || row.code.toLowerCase().includes(needle));
    return (
      <>
        <p className="border-b border-neutral-100 px-4 py-3 text-xs leading-5 text-neutral-600 sm:px-5">
          Uses, discount given, and sales for coupons used in this period. Product, category, and channel filters do not apply. Cancelled uses are left out.
        </p>
        <Paged
          caption="Coupon report"
          columns={columns}
          rows={filtered}
          sort={props.sort}
          direction={props.direction}
          page={props.page}
          onSort={props.onSort}
          onPage={props.onPage}
          rowKey={(row) => row.couponId}
          empty="No coupon redemptions in this period."
        />
      </>
    );
  }
  if (props.tab === "delivery") {
    if (!props.delivery) return null;
    const rows: DeliveryRow[] = [
      { id: "delivered", label: "Delivered", count: props.delivery.delivered, display: formatReportCount(props.delivery.delivered) },
      { id: "returned", label: "Returned", count: props.delivery.returned, display: formatReportCount(props.delivery.returned) },
      { id: "cancelled", label: "Cancelled", count: props.delivery.cancelled, display: formatReportCount(props.delivery.cancelled) },
      {
        id: "rate",
        label: "Return rate",
        count: props.delivery.returnRatePercent,
        display: formatReportPercent(props.delivery.returnRatePercent),
      },
    ];
    const columns: ReportColumn<DeliveryRow>[] = [
      { id: "label", label: "Status", sortValue: (row) => row.label, render: (row) => row.label },
      { id: "count", label: "Count", align: "right", sortValue: (row) => row.count, render: (row) => row.display },
    ];
    const quiet = props.delivery.delivered === 0 && props.delivery.returned === 0 && props.delivery.cancelled === 0;
    if (quiet) return <AdminEmpty title="No deliveries, returns, or cancellations in this period." />;
    return (
      <Paged
        caption="Delivery and returns"
        columns={columns}
        rows={rows.filter((row) => !needle || row.label.toLowerCase().includes(needle))}
        sort={props.sort}
        direction={props.direction}
        page={props.page}
        onSort={props.onSort}
        onPage={props.onPage}
        rowKey={(row) => row.id}
        empty="Nothing in this table matches the search."
      />
    );
  }
  return <AdminEmpty title="Nothing to show for this period." />;
}

function productColumns(): ReportColumn<ProductReportRow>[] {
  return [
    {
      id: "title",
      label: "Product",
      sortValue: (row) => row.title,
      render: (row) =>
        row.productId ? (
          <Link 
            href={`/admin/products/${row.productId}`} 
            className="font-medium text-slate-900 transition-colors hover:text-[#2bc0b5] hover:underline decoration-[#2bc0b5]/30 underline-offset-2"
          >
            {row.title}
          </Link>
        ) : (
          <span className="font-medium text-slate-900">{row.title}</span>
        ),
    },
    { 
      id: "units", 
      label: "Units", 
      align: "right", 
      sortValue: (row) => row.unitsSold, 
      render: (row) => <span className="font-medium text-slate-600">{formatReportCount(row.unitsSold)}</span> 
    },
    { 
      id: "revenue", 
      label: "Revenue", 
      align: "right", 
      sortValue: (row) => row.revenue, 
      render: (row) => <span className="font-semibold text-slate-900">{formatReportMoney(row.revenue)}</span> 
    },
    { 
      id: "cost", 
      label: "Cost", 
      align: "right", 
      sortValue: (row) => row.cost, 
      render: (row) => <span className="font-medium text-slate-500">{formatReportMoney(row.cost)}</span> 
    },
    { 
      id: "profit", 
      label: "Profit", 
      align: "right", 
      sortValue: (row) => row.profit, 
      render: (row) => {
        const isPositive = row.profit ? row.profit > 0 : false;
        const isNegative = row.profit ? row.profit < 0 : false;
        return (
          <span className={cn(
            "font-semibold",
            isPositive && "text-emerald-600",
            isNegative && "text-rose-600",
            !isPositive && !isNegative && "text-slate-900"
          )}>
            {formatReportMoney(row.profit)}
          </span>
        );
      }
    },
    {
      id: "margin",
      label: "Margin",
      align: "right",
      sortValue: (row) => row.marginPercent,
      render: (row) => {
        const margin = row.marginPercent ?? 0;
        return (
          <span className={cn(
            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold ring-1 ring-inset tabular-nums",
            margin >= 20 && "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
            margin >= 10 && margin < 20 && "bg-amber-50 text-amber-700 ring-amber-200/60",
            margin < 10 && "bg-slate-100 text-slate-600 ring-slate-200/60",
          )}>
            {formatReportPercent(row.marginPercent)}
          </span>
        );
      },
    },
    {
      id: "returns",
      label: "Returns",
      align: "right",
      sortValue: (row) => row.returnCount,
      render: (row) => {
        const count = row.returnCount;
        return (
          <span className={cn(
            "font-medium tabular-nums",
            count > 0 ? "text-amber-600" : "text-slate-400"
          )}>
            {formatReportCount(count)}
          </span>
        );
      },
    },
  ];
}

function stockColumns(): ReportColumn<StockRow>[] {
  return [
    {
      id: "title",
      label: "Product",
      sortValue: (row) => row.title,
      render: (row) => (
        <Link href={`/admin/products/${row.productId}`} className="hover:text-primary-ink">
          {row.title}
        </Link>
      ),
    },
    {
      id: "quantity",
      label: "On hand",
      align: "right",
      sortValue: (row) => row.quantity,
      render: (row) => (row.quantity == null ? "Made to order" : formatReportCount(row.quantity)),
    },
    { id: "value", label: "Stock value", align: "right", sortValue: (row) => row.stockValue, render: (row) => formatReportMoney(row.stockValue) },
    {
      id: "low",
      label: "Low stock",
      sortValue: (row) => (row.lowStock ? 1 : 0),
      render: (row) => (row.lowStock ? <span className="font-medium text-warning">Low</span> : "—"),
    },
    {
      id: "idle",
      label: "No sale in 30 days",
      sortValue: (row) => (row.noSale30d ? 1 : 0),
      render: (row) => (row.noSale30d ? "Yes" : "No"),
    },
  ];
}

function Paged<T>({
  caption,
  columns,
  rows,
  sort,
  direction,
  page,
  onSort,
  onPage,
  rowKey,
  empty,
  note,
}: {
  caption: string;
  columns: ReportColumn<T>[];
  rows: T[];
  sort: string;
  direction: Direction;
  page: number;
  onSort: (column: string) => void;
  onPage: (page: number) => void;
  rowKey: (row: T) => string;
  empty: string;
  note?: string;
}) {
  const ordered = sortRows(rows, columns, sort, direction);
  const pages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const slice = ordered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  if (ordered.length === 0) return <AdminEmpty title={empty} />;
  return (
    <>
      {note ? <p className="px-4 pt-3 text-xs text-neutral-600 sm:px-5">{note}</p> : null}
      <div className="print:hidden">
        <ReportTable
          caption={caption}
          rows={slice}
          columns={columns}
          sort={sort}
          direction={direction}
          onSort={onSort}
          rowKey={rowKey}
        />
        <InventoryPager page={safePage} pages={pages} total={ordered.length} pageSize={PAGE_SIZE} onPage={onPage} />
      </div>
      <div className="hidden print:block">
        <ReportTable
          caption={`${caption}, all rows`}
          rows={ordered}
          columns={columns}
          sort={sort}
          direction={direction}
          onSort={onSort}
          rowKey={rowKey}
        />
      </div>
    </>
  );
}

const PRINT_CSS = `
@media print {
  .force-light > aside,
  .force-light header,
  [data-print-hide] { display: none !important; }
  .force-light > div { padding-left: 0 !important; }
  .print-only { display: block !important; }
  .reports-page { color: var(--color-on-surface); }
}
.print-only { display: none; }
`;
