"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { adminButtonClass } from "@/app/admin/_components/admin-ui";
import {
  PRODUCT_REPORT_SORTS,
  REPORT_GRAINS,
  REPORT_ORIGINS,
  REPORT_PRESETS,
  REPORT_PROFIT_FILTERS,
  ReportQueryError,
  formatRangeLabel,
  presetBounds,
  resolveReportCall,
  type ProductReportSort,
  type ReportCall,
  type ReportGrain,
  type ReportOrigin,
  type ReportPreset,
  type ReportProfitFilter,
  type ResolvedWindow,
} from "@/lib/admin/reports";
import {
  loadReportFilterChoices,
  type ReportFilterChoices,
} from "@/lib/mart-api/reports";
import { cn } from "@/lib/utils";

export const PRESET_LABELS: Record<ReportPreset, string> = {
  today: "Today",
  "7d": "Last 7 Days",
  this_week: "This Week",
  this_month: "This Month",
  last_month: "Last Month",
  this_year: "This Year",
};

export const GRAIN_LABELS: Record<ReportGrain, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

function isPreset(value: string | null): value is ReportPreset {
  return value !== null && (REPORT_PRESETS as readonly string[]).includes(value);
}

function isOrigin(value: string | null): value is ReportOrigin {
  return value !== null && (REPORT_ORIGINS as readonly string[]).includes(value);
}

function isProfitFilter(value: string | null): value is ReportProfitFilter {
  return value !== null && (REPORT_PROFIT_FILTERS as readonly string[]).includes(value);
}

function isGrain(value: string | null): value is ReportGrain {
  return value !== null && (REPORT_GRAINS as readonly string[]).includes(value);
}

function isProductSort(value: string | null): value is ProductReportSort {
  return value !== null && (PRODUCT_REPORT_SORTS as readonly string[]).includes(value);
}

let cachedChoices: ReportFilterChoices | null = null;

export type ReportQueryState = {
  now: Date;
  preset: ReportPreset | null;
  from: string;
  to: string;
  isCustom: boolean;
  origin: ReportOrigin | null;
  channel: string | null;
  supplierId: string | null;
  categoryId: string | null;
  productId: string | null;
  profitFilter: ReportProfitFilter;
  grain: ReportGrain | null;
  sort: ProductReportSort | null;
  call: ReportCall;
  window: ResolvedWindow | null;
  queryError: string;
  rangeLabel: string;
  requestKey: string;
  hasActiveFilters: boolean;
  update: (patch: Record<string, string | null>) => void;
  reset: () => void;
  hrefFor: (targetPath: string, extra?: Record<string, string | null>) => string;
  exportFilename: (prefix: string) => string;
};

export function useReportQuery(): ReportQueryState {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [now] = useState(() => new Date());

  const rawPreset = params.get("preset");
  const rawFrom = params.get("from")?.trim() || "";
  const rawTo = params.get("to")?.trim() || "";
  const isCustom = !rawPreset && Boolean(rawFrom || rawTo);
  const preset: ReportPreset | null = isCustom
    ? null
    : isPreset(rawPreset)
      ? rawPreset
      : "this_month";

  const rawOrigin = params.get("origin");
  const rawChannel = params.get("channel");
  const origin: ReportOrigin | null = isOrigin(rawOrigin)
    ? rawOrigin
    : rawChannel === "website"
      ? "online"
      : rawChannel === "offline"
        ? "offline"
        : null;
  const channel: string | null = origin
    ? origin === "online"
      ? "website"
      : "offline"
    : rawChannel?.trim() || null;

  const supplierId = params.get("supplier_id")?.trim() || null;
  const categoryId = params.get("category_id")?.trim() || null;
  const productId = params.get("product_id")?.trim() || null;
  const rawProfitFilter = params.get("profit_filter");
  const profitFilter: ReportProfitFilter = isProfitFilter(rawProfitFilter)
    ? rawProfitFilter
    : "all";
  const rawGrain = params.get("grain");
  const grain: ReportGrain | null = isGrain(rawGrain) ? rawGrain : null;
  const rawSort = params.get("sort");
  const sort: ProductReportSort | null = isProductSort(rawSort) ? rawSort : null;

  const call = useMemo<ReportCall>(
    () => ({
      preset: isCustom ? null : preset,
      from: isCustom ? rawFrom : null,
      to: isCustom ? rawTo : null,
      origin,
      channel: origin ? null : channel,
      supplierId,
      categoryId,
      productId,
      profitFilter: profitFilter !== "all" ? profitFilter : null,
      grain,
      sort,
    }),
    [
      isCustom,
      preset,
      rawFrom,
      rawTo,
      origin,
      channel,
      supplierId,
      categoryId,
      productId,
      profitFilter,
      grain,
      sort,
    ],
  );

  const resolved = useMemo<{ window: ResolvedWindow | null; error: string }>(() => {
    try {
      return { window: resolveReportCall(call, now), error: "" };
    } catch (error) {
      return {
        window: null,
        error:
          error instanceof ReportQueryError
            ? error.message
            : "Check the selected date range and filters.",
      };
    }
  }, [call, now]);

  const effectiveFrom = resolved.window?.from ?? rawFrom;
  const effectiveTo = resolved.window?.to ?? rawTo;
  const rangeLabel =
    effectiveFrom && effectiveTo
      ? formatRangeLabel(effectiveFrom, effectiveTo)
      : "Select a valid range";

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        preset: call.preset ?? null,
        from: resolved.window?.from ?? call.from ?? null,
        to: resolved.window?.to ?? call.to ?? null,
        origin: call.origin ?? null,
        channel: call.channel ?? null,
        supplierId: call.supplierId ?? null,
        categoryId: call.categoryId ?? null,
        productId: call.productId ?? null,
        profitFilter: call.profitFilter ?? null,
        grain: call.grain ?? null,
        sort: call.sort ?? null,
      }),
    [call, resolved.window?.from, resolved.window?.to],
  );

  const hasActiveFilters = Boolean(
    isCustom ||
      (preset && preset !== "this_month") ||
      origin ||
      channel ||
      supplierId ||
      categoryId ||
      productId ||
      profitFilter !== "all" ||
      grain,
  );

  function buildSearch(patch: Record<string, string | null>, base = params.toString()) {
    const next = new URLSearchParams(base);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    return next.toString();
  }

  function update(patch: Record<string, string | null>) {
    const query = buildSearch(patch);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function reset() {
    router.replace(pathname, { scroll: false });
  }

  function hrefFor(targetPath: string, extra?: Record<string, string | null>) {
    const keep = new URLSearchParams();
    for (const key of [
      "preset",
      "from",
      "to",
      "origin",
      "supplier_id",
      "category_id",
      "product_id",
    ]) {
      const value = params.get(key);
      if (value) keep.set(key, value);
    }
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (value === null || value === "") keep.delete(key);
        else keep.set(key, value);
      }
    }
    const query = keep.toString();
    return query ? `${targetPath}?${query}` : targetPath;
  }

  function exportFilename(prefix: string) {
    const from = resolved.window?.from ?? "from";
    const to = resolved.window?.to ?? "to";
    return `implesia-${prefix}-${from}-to-${to}.xlsx`;
  }

  return {
    now,
    preset,
    from: effectiveFrom,
    to: effectiveTo,
    isCustom,
    origin,
    channel,
    supplierId,
    categoryId,
    productId,
    profitFilter,
    grain,
    sort,
    call,
    window: resolved.window,
    queryError: resolved.error,
    rangeLabel,
    requestKey,
    hasActiveFilters,
    update,
    reset,
    hrefFor,
    exportFilename,
  };
}

export function ReportFilterBar({
  query,
  showOrigin = true,
  showSupplier = true,
  showCategory = true,
  showProduct = true,
  showGrain = false,
  note,
}: {
  query: ReportQueryState;
  showOrigin?: boolean;
  showSupplier?: boolean;
  showCategory?: boolean;
  showProduct?: boolean;
  showGrain?: boolean;
  note?: string;
}) {
  const [choices, setChoices] = useState<ReportFilterChoices>(
    () => cachedChoices ?? { products: [], categories: [], suppliers: [] },
  );
  const [customDraft, setCustomDraft] = useState<{ from: string; to: string }>({
    from: query.from,
    to: query.to,
  });
  const [customOpen, setCustomOpen] = useState(query.isCustom);

  useEffect(() => {
    if (cachedChoices) return;
    let active = true;
    loadReportFilterChoices().then((loaded) => {
      cachedChoices = loaded;
      if (active) setChoices(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  function pickPreset(next: ReportPreset) {
    setCustomOpen(false);
    query.update({ preset: next, from: null, to: null });
  }

  function openCustom() {
    const fallback = presetBounds(query.preset ?? "this_month", query.now);
    const from = query.from || fallback.from;
    const to = query.to || fallback.to;
    setCustomDraft({ from, to });
    setCustomOpen(true);
    if (!query.isCustom) {
      query.update({ preset: null, from, to });
    }
  }

  function applyCustomDates(from: string, to: string) {
    setCustomDraft({ from, to });
    if (from && to) {
      query.update({ preset: null, from, to });
    }
  }

  const showSelectors = showOrigin || showSupplier || showCategory || showProduct || showGrain;

  return (
    <section
      aria-label="Report filters"
      className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm sm:p-4 print:hidden"
    >
      {/* Row 1: Date Presets & Custom Range */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Date range presets">
          {REPORT_PRESETS.map((id) => {
            const active = !customOpen && !query.isCustom && query.preset === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => pickPreset(id)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-[#0b3d39] text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900",
                )}
              >
                {PRESET_LABELS[id]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={openCustom}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
              customOpen || query.isCustom
                ? "bg-[#0b3d39] text-white shadow-xs"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900",
            )}
          >
            <MaterialIcon name="date_range" className="text-[15px]" />
            Custom Range
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
            <MaterialIcon name="schedule" className="text-[14px] text-slate-400" />
            {query.rangeLabel}
          </span>
          {query.hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setCustomOpen(false);
                query.reset();
              }}
              className={cn(adminButtonClass.quiet, "h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900")}
            >
              <MaterialIcon name="restart_alt" className="text-[15px]" />
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {/* Custom Date Inputs */}
      {customOpen || query.isCustom ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              From (Dhaka)
            </span>
            <input
              type="date"
              value={customDraft.from || query.from}
              onChange={(event) =>
                applyCustomDates(event.target.value, customDraft.to || query.to)
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              To (Dhaka)
            </span>
            <input
              type="date"
              value={customDraft.to || query.to}
              onChange={(event) =>
                applyCustomDates(customDraft.from || query.from, event.target.value)
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 outline-none focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
            />
          </label>
          <p className="text-[11px] text-slate-500">Inclusive dates · up to 366 days</p>
        </div>
      ) : null}

      {/* Row 2: Dimensional Selectors */}
      {showSelectors ? (
        <div className="grid gap-2.5 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {showOrigin ? (
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Channel / Origin
              </span>
              <select
                aria-label="Channel or Origin"
                value={query.origin ?? ""}
                onChange={(event) =>
                  query.update({
                    origin: event.target.value || null,
                    channel: null,
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 outline-none transition hover:border-slate-300 focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
              >
                <option value="">All channels</option>
                <option value="online">Online (Website)</option>
                <option value="offline">Offline (Counter / Phone)</option>
              </select>
            </label>
          ) : null}

          {showSupplier ? (
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Supplier
              </span>
              <select
                aria-label="Supplier"
                value={query.supplierId ?? ""}
                onChange={(event) =>
                  query.update({ supplier_id: event.target.value || null })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 outline-none transition hover:border-slate-300 focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
              >
                <option value="">All suppliers</option>
                {choices.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showCategory ? (
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Category
              </span>
              <select
                aria-label="Category"
                value={query.categoryId ?? ""}
                onChange={(event) =>
                  query.update({ category_id: event.target.value || null })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 outline-none transition hover:border-slate-300 focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
              >
                <option value="">All categories</option>
                {choices.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showProduct ? (
            <ProductFilterDropdown
              products={choices.products}
              value={query.productId}
              onChange={(next) => query.update({ product_id: next })}
            />
          ) : null}

          {showGrain ? (
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Chart Grain
              </span>
              <select
                aria-label="Chart grain"
                value={query.grain ?? ""}
                onChange={(event) =>
                  query.update({ grain: event.target.value || null })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-900 outline-none transition hover:border-slate-300 focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
              >
                <option value="">Auto grain</option>
                {REPORT_GRAINS.map((g) => (
                  <option key={g} value={g}>
                    {GRAIN_LABELS[g]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      {note ? (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <MaterialIcon name="info" className="text-[14px] text-slate-400" />
          {note}
        </p>
      ) : null}
    </section>
  );
}

function ProductFilterDropdown({
  products,
  value,
  onChange,
}: {
  products: { id: string; title: string }[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const selected = products.find((p) => p.id === value) ?? null;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 50);
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 50);
  }, [products, search]);

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Product
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-xs font-medium text-slate-900 outline-none transition hover:border-slate-300 focus:border-[#2bc0b5] focus:ring-2 focus:ring-[#2bc0b5]/25"
      >
        <span className="truncate">
          {selected ? selected.title : value ? "Selected product" : "All products"}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-slate-400">
          {value ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear product filter"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
              className="grid size-5 place-items-center rounded hover:bg-slate-100 hover:text-slate-700"
            >
              <MaterialIcon name="close" className="text-[14px]" />
            </span>
          ) : null}
          <MaterialIcon name="expand_more" className="text-[16px]" />
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 left-0 z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products…"
              autoFocus
              className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-[#2bc0b5]"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1 text-xs">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50",
                  !value && "bg-teal-50/70 font-semibold text-[#0b3d39]",
                )}
              >
                All products
              </button>
            </li>
            {filtered.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(product.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50",
                    value === product.id && "bg-teal-50/70 font-semibold text-[#0b3d39]",
                  )}
                >
                  <span className="truncate">{product.title}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-slate-400">No matching products</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
