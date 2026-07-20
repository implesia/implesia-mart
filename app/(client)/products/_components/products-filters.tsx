"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  productFilters,
  type ProductCategoryId,
  type ProductStatus,
} from "../../_data/products/products";

type ProductsFiltersProps = {
  className?: string;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  availability: ProductStatus[];
  onAvailabilityToggle: (id: ProductStatus) => void;
  categories: ProductCategoryId[];
  onCategoryToggle: (id: ProductCategoryId) => void;
  onReset: () => void;
};

function formatTaka(value: number) {
  if (value >= PRICE_FILTER_MAX) return `৳${PRICE_FILTER_MAX.toLocaleString("en-US")}+`;
  return `৳${value.toLocaleString("en-US")}`;
}

export function ProductsFilters({
  className,
  priceRange,
  onPriceRangeChange,
  availability,
  onAvailabilityToggle,
  categories,
  onCategoryToggle,
  onReset,
}: ProductsFiltersProps) {
  return (
    <aside
      className={cn(
        "custom-scrollbar sticky top-20 hidden h-[calc(100vh-5rem)] w-56 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border pr-5 pt-2 xl:w-60 xl:pr-6 lg:flex",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-foreground">ফিল্টার</h2>
          <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
            রিজাল্ট সীমিত করুন
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-xs font-semibold text-primary hover:underline"
        >
          রিসেট
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <div className="mb-3 flex items-center gap-2 text-primary">
            <MaterialIcon name="category" className="text-[20px]" />
            <span className="text-xs font-semibold tracking-wider uppercase">ক্যাটাগরি</span>
          </div>
          <div className="space-y-2 px-1">
            {productFilters.categories.map((option) => {
              const checked = categories.includes(option.id);
              return (
                <label
                  key={option.id}
                  className="group flex cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onCategoryToggle(option.id)}
                  />
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      checked
                        ? "font-medium text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-primary">
            <MaterialIcon name="payments" className="text-[20px]" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              দামের রেঞ্জ
            </span>
          </div>
          <div className="px-1">
            <Slider
              value={priceRange}
              min={PRICE_FILTER_MIN}
              max={PRICE_FILTER_MAX}
              step={100}
              onValueChange={(value) => {
                if (!Array.isArray(value) || value.length < 2) return;
                const [min, max] = value;
                onPriceRangeChange([
                  Math.min(min, max),
                  Math.max(min, max),
                ]);
              }}
            />
            <div className="mt-2 flex justify-between text-xs font-medium text-foreground">
              <span>{formatTaka(priceRange[0])}</span>
              <span>{formatTaka(priceRange[1])}</span>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-primary">
            <MaterialIcon name="inventory_2" className="text-[20px]" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              এভেইলেবিলিটি
            </span>
          </div>
          <div className="space-y-2 px-1">
            {productFilters.availability.map((option) => {
              const checked = availability.includes(option.id);
              return (
                <label
                  key={option.id}
                  className="group flex cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onAvailabilityToggle(option.id)}
                  />
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      checked
                        ? "font-medium text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
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
    </aside>
  );
}
