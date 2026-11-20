"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CategoryTile } from "@/lib/mart-api/categories";
import { categoryBranch } from "@/lib/mart-api/category-tree";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  productFilters,
  type ProductCategoryId,
  type ProductStatus,
} from "../../_data/products/catalog-meta";

export type ProductsFilterControls = {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  availability: ProductStatus[];
  onAvailabilityToggle: (id: ProductStatus) => void;
  /** Visible categories from the API, depth-first. Empty hides the section. */
  categoryTree: CategoryTile[];
  activeCategory?: ProductCategoryId;
  onCategorySelect: (id: ProductCategoryId | "all") => void;
  onReset: () => void;
  availabilityCounts: Record<ProductStatus, number>;
  resultCount: number;
  canReset: boolean;
};

const PRICE_PRESETS: { id: string; label: string; range: [number, number] }[] =
  [
    { id: "all", label: "All", range: [PRICE_FILTER_MIN, PRICE_FILTER_MAX] },
    { id: "under-1k", label: "Under ৳1k", range: [0, 1000] },
    { id: "1k-5k", label: "৳1k–5k", range: [1000, 5000] },
    { id: "5k-15k", label: "৳5k–15k", range: [5000, 15000] },
    { id: "15k+", label: "৳15k+", range: [15000, PRICE_FILTER_MAX] },
  ];

const TICK_POINTS = [0, 10000, 25000, 50000];

const AVAILABILITY_LABELS: Record<ProductStatus, string> = {
  available: "In Stock",
  "sold-out": "Out of Stock",
  "coming-soon": "Coming Soon",
};

function clampPrice(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function parseDigits(value: string, fallback: number): number {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return fallback;
  const num = Number(digits);
  return Number.isFinite(num) ? num : fallback;
}

function FilterBody({
  priceRange,
  onPriceRangeChange,
  availability,
  onAvailabilityToggle,
  categoryTree,
  activeCategory,
  onCategorySelect,
  onReset,
  availabilityCounts,
  resultCount,
  canReset,
  showHeading = true,
}: ProductsFilterControls & { showHeading?: boolean }) {
  const [draft, setDraft] = useState<[number, number]>(priceRange);
  const [minInput, setMinInput] = useState(() => priceRange[0].toLocaleString("en-US"));
  const [maxInput, setMaxInput] = useState(() => priceRange[1].toLocaleString("en-US"));
  const [prevPriceRange, setPrevPriceRange] = useState<[number, number]>(priceRange);

  // Sync inputs when priceRange prop changes externally without triggering cascading effect renders
  if (prevPriceRange[0] !== priceRange[0] || prevPriceRange[1] !== priceRange[1]) {
    setPrevPriceRange(priceRange);
    setDraft(priceRange);
    setMinInput(priceRange[0].toLocaleString("en-US"));
    setMaxInput(priceRange[1].toLocaleString("en-US"));
  }

  const allCategoriesSelected = !activeCategory;
  const categoryRows = categoryBranch(categoryTree, activeCategory);

  const handleSliderChange = (value: number | readonly number[]) => {
    if (!Array.isArray(value) || value.length < 2) return;
    const min = Math.min(value[0], value[1]);
    const max = Math.max(value[0], value[1]);
    setDraft([min, max]);
    setMinInput(min.toLocaleString("en-US"));
    setMaxInput(max.toLocaleString("en-US"));
  };

  const commitMin = () => {
    const rawVal = parseDigits(minInput, 0);
    const validMin = clampPrice(rawVal, PRICE_FILTER_MIN, PRICE_FILTER_MAX);
    const nextMax = Math.max(validMin, draft[1]);
    const newDraft: [number, number] = [validMin, nextMax];
    setDraft(newDraft);
    setMinInput(validMin.toLocaleString("en-US"));
    setMaxInput(nextMax.toLocaleString("en-US"));
    onPriceRangeChange(newDraft);
  };

  const commitMax = () => {
    const rawVal = parseDigits(maxInput, PRICE_FILTER_MAX);
    const validMax = clampPrice(rawVal, PRICE_FILTER_MIN, PRICE_FILTER_MAX);
    const nextMin = Math.min(validMax, draft[0]);
    const newDraft: [number, number] = [nextMin, validMax];
    setDraft(newDraft);
    setMinInput(nextMin.toLocaleString("en-US"));
    setMaxInput(validMax.toLocaleString("en-US"));
    onPriceRangeChange(newDraft);
  };

  return (
    <div className="flex flex-col gap-4.5 [&>section+section]:border-t [&>section+section]:border-neutral-100 dark:[&>section+section]:border-white/10 [&>section+section]:pt-4">
      {showHeading ? (
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MaterialIcon name="tune" className="text-[17px]" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Filters</h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {resultCount} {resultCount === 1 ? "product" : "products"}
              </p>
            </div>
          </div>
          {canReset ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <MaterialIcon name="refresh" className="text-[13px]" />
              Reset
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Categories */}
      <section>
        <div className="mb-2 flex items-center gap-1.5">
          <span className="flex size-4.5 items-center justify-center text-primary">
            <MaterialIcon name="category" className="text-[15px]" />
          </span>
          <span className="text-[11px] font-bold tracking-wider text-neutral-800 uppercase dark:text-neutral-200">
            Categories
          </span>
        </div>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => onCategorySelect("all")}
            aria-pressed={allCategoriesSelected}
            className={cn(
              "flex min-h-9 w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs sm:text-[13px] transition-all",
              allCategoriesSelected
                ? "bg-primary/10 font-bold text-primary shadow-2xs"
                : "text-neutral-700 hover:bg-neutral-100/70 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white",
            )}
          >
            <span>All Categories</span>
            {allCategoriesSelected ? (
              <span className="size-1.5 rounded-full bg-primary" />
            ) : null}
          </button>
          {categoryRows.map(({ item, depth, active }) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onCategorySelect(item.slug)}
              aria-pressed={active}
              aria-current={active ? "true" : undefined}
              style={{ paddingInlineStart: `${0.625 + depth * 0.65}rem` }}
              className={cn(
                "flex min-h-9 w-full items-center justify-between rounded-xl py-1.5 pe-2.5 text-left text-xs sm:text-[13px] transition-all",
                active
                  ? "bg-primary/10 font-bold text-primary shadow-2xs"
                  : "text-neutral-700 hover:bg-neutral-100/70 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className={cn(
                "ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                active ? "bg-primary/20 text-primary-ink" : "bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-neutral-400"
              )}>
                {item.productCount}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Price Range */}
      <section>
        <div className="mb-2 flex items-center gap-1.5">
          <span className="flex size-4.5 items-center justify-center text-primary">
            <MaterialIcon name="payments" className="text-[15px]" />
          </span>
          <span className="text-[11px] font-bold tracking-wider text-neutral-800 uppercase dark:text-neutral-200">
            Price Range
          </span>
        </div>
        <div className="px-1 pt-3 pb-1">
          {/* Slider with step points and tooltips */}
          <Slider
            value={draft}
            min={PRICE_FILTER_MIN}
            max={PRICE_FILTER_MAX}
            step={500}
            minStepsBetweenValues={1}
            showTicks={true}
            ticks={TICK_POINTS}
            formatTooltip={(val) => `৳${val.toLocaleString("en-US")}`}
            onValueChange={handleSliderChange}
            onValueCommitted={(value) => {
              if (!Array.isArray(value) || value.length < 2) return;
              const min = Math.min(value[0], value[1]);
              const max = Math.max(value[0], value[1]);
              onPriceRangeChange([min, max]);
            }}
          />

          {/* Tick Points Milestone Labels */}
          <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 px-0.5">
            <button
              type="button"
              onClick={() => {
                const next: [number, number] = [0, draft[1]];
                setDraft(next);
                setMinInput("0");
                onPriceRangeChange(next);
              }}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              ৳0
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMax = Math.max(draft[0], 10000);
                const next: [number, number] = [draft[0], nextMax];
                setDraft(next);
                setMaxInput(nextMax.toLocaleString("en-US"));
                onPriceRangeChange(next);
              }}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              ৳10k
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMax = Math.max(draft[0], 25000);
                const next: [number, number] = [draft[0], nextMax];
                setDraft(next);
                setMaxInput(nextMax.toLocaleString("en-US"));
                onPriceRangeChange(next);
              }}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              ৳25k
            </button>
            <button
              type="button"
              onClick={() => {
                const next: [number, number] = [draft[0], 50000];
                setDraft(next);
                setMaxInput("50,000");
                onPriceRangeChange(next);
              }}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              ৳50k
            </button>
          </div>

          {/* Formatted Min & Max Input Boxes with Clear Labels */}
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/70 p-2 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 dark:border-white/10 dark:bg-white/5">
              <span className="block text-[9.5px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Min Price
              </span>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">৳</span>
                <input
                  aria-label="Minimum price"
                  type="text"
                  inputMode="numeric"
                  value={minInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, "");
                    setMinInput(digits ? Number(digits).toLocaleString("en-US") : "");
                  }}
                  onFocus={(e) => e.target.select()}
                  onBlur={commitMin}
                  onKeyDown={(e) => e.key === "Enter" && commitMin()}
                  placeholder="0"
                  className="w-full bg-transparent text-xs font-extrabold text-neutral-900 outline-none tabular-nums dark:text-white"
                />
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/70 p-2 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 dark:border-white/10 dark:bg-white/5">
              <span className="block text-[9.5px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Max Price
              </span>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">৳</span>
                <input
                  aria-label="Maximum price"
                  type="text"
                  inputMode="numeric"
                  value={maxInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, "");
                    setMaxInput(digits ? Number(digits).toLocaleString("en-US") : "");
                  }}
                  onFocus={(e) => e.target.select()}
                  onBlur={commitMax}
                  onKeyDown={(e) => e.key === "Enter" && commitMax()}
                  placeholder="50,000"
                  className="w-full bg-transparent text-xs font-extrabold text-neutral-900 outline-none tabular-nums dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Quick Filter Presets */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((preset) => {
              const active =
                draft[0] === preset.range[0] && draft[1] === preset.range[1];
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setDraft(preset.range);
                    setMinInput(preset.range[0].toLocaleString("en-US"));
                    setMaxInput(preset.range[1].toLocaleString("en-US"));
                    onPriceRangeChange(preset.range);
                  }}
                  className={cn(
                    "rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer",
                    active
                      ? "bg-neutral-950 text-white shadow-2xs dark:bg-white dark:text-neutral-950"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70 hover:text-neutral-950 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Availability */}
      <section>
        <div className="mb-2 flex items-center gap-1.5">
          <span className="flex size-4.5 items-center justify-center text-primary">
            <MaterialIcon name="inventory_2" className="text-[15px]" />
          </span>
          <span className="text-[11px] font-bold tracking-wider text-neutral-800 uppercase dark:text-neutral-200">
            Availability
          </span>
        </div>
        <div className="space-y-0.5">
          {productFilters.availability.map((option) => {
            const checked = availability.includes(option.id);
            const label = AVAILABILITY_LABELS[option.id] ?? option.label;
            return (
              <label
                key={option.id}
                className={cn(
                  "group flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-neutral-100/60 dark:hover:bg-white/5",
                )}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onAvailabilityToggle(option.id)}
                  />
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      checked
                        ? "font-bold text-neutral-900 dark:text-white"
                        : "text-neutral-600 group-hover:text-neutral-950 dark:text-neutral-400 dark:group-hover:text-white",
                    )}
                  >
                    {label}
                  </span>
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 tabular-nums dark:bg-white/10 dark:text-neutral-400">
                  {availabilityCounts[option.id]}
                </span>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function ProductsFilters({
  className,
  ...filterProps
}: ProductsFilterControls & { className?: string }) {
  return (
    <aside
      className={cn(
        "custom-scrollbar sticky top-[7.5rem] z-20 hidden h-fit max-h-[calc(100dvh-8rem)] w-56 xl:w-64 shrink-0 self-start overflow-y-auto lg:block",
        "rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:border-white/10 dark:bg-[#121a19] dark:shadow-none",
        className,
      )}
    >
      <FilterBody
        key={`${filterProps.priceRange[0]}-${filterProps.priceRange[1]}`}
        {...filterProps}
      />
    </aside>
  );
}

export function ProductsMobileFilters({
  open,
  onOpenChange,
  ...filterProps
}: ProductsFilterControls & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="force-light flex h-full w-[min(100%,20rem)] flex-col gap-0 border-outline-variant/30 bg-white p-0"
      >
        <SheetHeader className="relative shrink-0 border-b border-neutral-100 px-4 py-3 pr-20 text-left sm:px-5 dark:border-white/10">
          <SheetTitle className="text-base font-bold text-neutral-950 dark:text-white">Filters</SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-2.5 right-3 inline-flex h-9 items-center rounded-lg px-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white"
          >
            Close
          </button>
          <SheetDescription className="text-xs text-neutral-500 dark:text-neutral-400">
            {filterProps.resultCount} products. Filter by category, price and availability.
          </SheetDescription>
        </SheetHeader>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <FilterBody
            key={`${filterProps.priceRange[0]}-${filterProps.priceRange[1]}`}
            {...filterProps}
            showHeading={false}
          />
        </div>
        <div className="shrink-0 border-t border-neutral-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-10.5 w-full items-center justify-center rounded-xl bg-primary-ink text-sm font-semibold text-white shadow-xs transition-opacity hover:opacity-95"
          >
            View Results
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
