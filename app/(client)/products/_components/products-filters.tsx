"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  categoryLabels,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  productFilters,
  type ProductCategoryId,
  type ProductStatus,
} from "../../_data/products/products";

export type ProductsFilterControls = {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  availability: ProductStatus[];
  onAvailabilityToggle: (id: ProductStatus) => void;
  categories: ProductCategoryId[];
  onCategorySelect: (id: ProductCategoryId | "all") => void;
  onReset: () => void;
  categoryCounts: Record<ProductCategoryId, number>;
  availabilityCounts: Record<ProductStatus, number>;
  resultCount: number;
  canReset: boolean;
};

const PRICE_PRESETS: { id: string; label: string; range: [number, number] }[] = [
  { id: "all", label: "সব", range: [PRICE_FILTER_MIN, PRICE_FILTER_MAX] },
  { id: "under-1k", label: "৳1,000-এর কম", range: [0, 1000] },
  { id: "mid", label: "৳1,000–3,000", range: [1000, 3000] },
  { id: "high", label: "৳3,000+", range: [3000, PRICE_FILTER_MAX] },
];

function clampPrice(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function FilterBody({
  priceRange,
  onPriceRangeChange,
  availability,
  onAvailabilityToggle,
  categories,
  onCategorySelect,
  onReset,
  categoryCounts,
  availabilityCounts,
  resultCount,
  canReset,
}: ProductsFilterControls) {
  const allCategoriesSelected =
    categories.length === productFilters.categories.length;

  const setBound = (index: 0 | 1, raw: number) => {
    const next: [number, number] = [...priceRange];
    next[index] = raw;
    const min = clampPrice(Math.min(next[0], next[1]), PRICE_FILTER_MIN, PRICE_FILTER_MAX);
    const max = clampPrice(Math.max(next[0], next[1]), PRICE_FILTER_MIN, PRICE_FILTER_MAX);
    onPriceRangeChange([min, max]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-on-surface">ফিল্টার</h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            {resultCount}টি প্রোডাক্ট
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
            canReset
              ? "bg-primary/10 text-primary hover:bg-primary/15"
              : "cursor-default bg-surface-container-low text-on-surface-variant/50",
          )}
        >
          <MaterialIcon name="refresh" className="text-[14px]" />
          রিসেট
        </button>
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="category" className="text-[16px]" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-on-surface uppercase">
            ক্যাটাগরি
          </span>
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onCategorySelect("all")}
            className={cn(
              "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
              allCategoriesSelected
                ? "bg-primary/8 font-medium text-on-surface ring-1 ring-primary/20"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
            )}
          >
            সব
          </button>
          {productFilters.categories.map((option) => {
            const active =
              !allCategoriesSelected &&
              categories.length === 1 &&
              categories[0] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onCategorySelect(option.id)}
                className={cn(
                  "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-primary/8 font-medium text-on-surface ring-1 ring-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                )}
              >
                <span className="min-w-0 flex-1">{categoryLabels[option.id]}</span>
                <span className="text-xs font-medium text-on-surface-variant tabular-nums">
                  {categoryCounts[option.id]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="payments" className="text-[16px]" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-on-surface uppercase">
            দামের রেঞ্জ
          </span>
        </div>
        <div className="rounded-xl bg-surface-container-low/80 px-3 pt-5 pb-3">
          <Slider
            value={priceRange}
            min={PRICE_FILTER_MIN}
            max={PRICE_FILTER_MAX}
            step={100}
            minStepsBetweenValues={1}
            onValueChange={(value) => {
              if (!Array.isArray(value) || value.length < 2) return;
              const [min, max] = value;
              onPriceRangeChange([Math.min(min, max), Math.max(min, max)]);
            }}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="flex items-center gap-1 rounded-md bg-surface-container-lowest px-2 py-1.5 ring-1 ring-outline-variant/30 dark:bg-surface-container dark:ring-white/10">
              <span className="text-xs text-on-surface-variant">৳</span>
              <input
                aria-label="সর্বনিম্ন দাম"
                type="number"
                inputMode="numeric"
                min={PRICE_FILTER_MIN}
                max={priceRange[1]}
                step={100}
                value={priceRange[0]}
                onChange={(event) => setBound(0, Number(event.target.value))}
                className="w-full bg-transparent text-xs font-semibold text-on-surface outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
            <label className="flex items-center gap-1 rounded-md bg-surface-container-lowest px-2 py-1.5 ring-1 ring-outline-variant/30 dark:bg-surface-container dark:ring-white/10">
              <span className="text-xs text-on-surface-variant">৳</span>
              <input
                aria-label="সর্বোচ্চ দাম"
                type="number"
                inputMode="numeric"
                min={priceRange[0]}
                max={PRICE_FILTER_MAX}
                step={100}
                value={priceRange[1]}
                onChange={(event) => setBound(1, Number(event.target.value))}
                className="w-full bg-transparent text-xs font-semibold text-on-surface outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((preset) => {
              const active =
                priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onPriceRangeChange(preset.range)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/30 hover:text-on-surface dark:bg-surface-container dark:ring-white/10",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="inventory_2" className="text-[16px]" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-on-surface uppercase">
            স্টক
          </span>
        </div>
        <div className="space-y-1">
          {productFilters.availability.map((option) => {
            const checked = availability.includes(option.id);
            return (
              <label
                key={option.id}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors",
                  checked
                    ? "bg-primary/8 ring-1 ring-primary/20"
                    : "hover:bg-surface-container-low",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onAvailabilityToggle(option.id)}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm transition-colors",
                    checked
                      ? "font-medium text-on-surface"
                      : "text-on-surface-variant group-hover:text-on-surface",
                  )}
                >
                  {option.label}
                </span>
                <span className="text-xs font-medium text-on-surface-variant tabular-nums">
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
        "custom-scrollbar sticky top-[7rem] z-20 hidden h-fit max-h-[calc(100dvh-7.5rem)] w-52 shrink-0 self-start overflow-y-auto sm:top-[8.75rem] sm:max-h-[calc(100dvh-9.25rem)] lg:top-[9.5rem] lg:block lg:max-h-[calc(100dvh-10rem)] xl:w-56",
        "rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-3.5 xl:p-4",
        "shadow-[0_8px_30px_rgba(6,47,44,0.04)] dark:border-white/10 dark:bg-surface-container dark:shadow-none",
        className,
      )}
    >
      <FilterBody {...filterProps} />
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
        className="force-light flex h-full w-[min(100%,20rem)] flex-col gap-0 border-outline-variant/30 bg-white p-0"
      >
        <SheetHeader className="shrink-0 border-b border-outline-variant/25 px-4 py-3 text-left sm:px-5 dark:border-white/10">
          <SheetTitle className="text-on-surface">ফিল্টার</SheetTitle>
          <SheetDescription className="text-on-surface-variant">
            ক্যাটাগরি, দাম ও স্টক দিয়ে সীমিত করুন
          </SheetDescription>
        </SheetHeader>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <FilterBody {...filterProps} />
        </div>
        <div className="shrink-0 border-t border-outline-variant/25 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            রেজাল্ট দেখুন
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
