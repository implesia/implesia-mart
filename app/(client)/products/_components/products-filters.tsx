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
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  productFilters,
  type ProductStatus,
} from "../../_data/products/products";

export type ProductsFilterControls = {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  availability: ProductStatus[];
  onAvailabilityToggle: (id: ProductStatus) => void;
  onReset: () => void;
};

function formatTaka(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

function FilterBody({
  priceRange,
  onPriceRangeChange,
  availability,
  onAvailabilityToggle,
  onReset,
}: ProductsFilterControls) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-on-surface">ফিল্টার</h2>
          <p className="mt-1 text-xs text-on-surface-variant">পছন্দমতো খুঁজে নিন</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          <MaterialIcon name="refresh" className="text-[14px]" />
          রিসেট
        </button>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="payments" className="text-[16px]" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-on-surface uppercase">
            দামের রেঞ্জ
          </span>
        </div>
        <div className="rounded-xl bg-surface-container-low/80 px-3 py-4">
          <Slider
            value={priceRange}
            min={PRICE_FILTER_MIN}
            max={PRICE_FILTER_MAX}
            step={100}
            onValueChange={(value) => {
              if (!Array.isArray(value) || value.length < 2) return;
              const [min, max] = value;
              onPriceRangeChange([Math.min(min, max), Math.max(min, max)]);
            }}
          />
          <div className="mt-3 flex justify-between text-xs font-semibold text-on-surface">
            <span className="rounded-md bg-surface-container-lowest px-2 py-1 ring-1 ring-outline-variant/30 dark:bg-surface-container dark:ring-white/10">
              {formatTaka(priceRange[0])}
            </span>
            <span className="rounded-md bg-surface-container-lowest px-2 py-1 ring-1 ring-outline-variant/30 dark:bg-surface-container dark:ring-white/10">
              {formatTaka(priceRange[1])}
            </span>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MaterialIcon name="inventory_2" className="text-[16px]" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-on-surface uppercase">
            এভেইলেবিলিটি
          </span>
        </div>
        <div className="space-y-1">
          {productFilters.availability.map((option) => {
            const checked = availability.includes(option.id);
            return (
              <label
                key={option.id}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
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
                    "text-sm transition-colors",
                    checked
                      ? "font-medium text-on-surface"
                      : "text-on-surface-variant group-hover:text-on-surface",
                  )}
                >
                  {option.label}
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
        "custom-scrollbar sticky top-[7.25rem] hidden h-fit max-h-[calc(100vh-8.5rem)] w-56 shrink-0 overflow-y-auto sm:top-[8.75rem] lg:top-[10rem] lg:block xl:w-64",
        "rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-4 xl:p-5",
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
        <SheetHeader className="shrink-0 border-b border-outline-variant/25 px-4 py-4 text-left sm:px-5 dark:border-white/10">
          <SheetTitle className="text-on-surface">ফিল্টার</SheetTitle>
          <SheetDescription className="text-on-surface-variant">
            দাম ও এভেইলেবিলিটি দিয়ে সীমিত করুন
          </SheetDescription>
        </SheetHeader>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
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
