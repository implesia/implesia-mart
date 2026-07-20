"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  categoryLabels,
  productFilters,
  type ProductCategoryId,
} from "../../_data/products/products";

type SortId = (typeof productFilters.sortOptions)[number]["id"];

type ProductsToolbarProps = {
  className?: string;
  title: string;
  totalLabel: string;
  sort: SortId;
  onSortChange: (sort: SortId) => void;
  categories: ProductCategoryId[];
  onCategorySelect: (id: ProductCategoryId | "all") => void;
  onOpenMobileFilters: () => void;
};

export function ProductsToolbar({
  className,
  title,
  totalLabel,
  sort,
  onSortChange,
  categories,
  onCategorySelect,
  onOpenMobileFilters,
}: ProductsToolbarProps) {
  const allSelected =
    (categories?.length ?? 0) === productFilters.categories.length;

  return (
    <div className={cn("mb-6 space-y-5 sm:mb-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            কালেকশন
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">{totalLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold lg:hidden",
              "border border-outline-variant/40 bg-surface-container-lowest text-on-surface",
              "dark:border-white/10 dark:bg-surface-container",
              "transition-colors hover:border-primary/35 hover:text-primary",
            )}
          >
            <MaterialIcon name="tune" className="text-[18px]" />
            ফিল্টার
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-on-surface-variant sm:inline">সাজান</span>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (!value) return;
                onSortChange(value as SortId);
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-10 min-w-[10.5rem] rounded-xl border border-outline-variant/40 bg-surface-container-lowest pr-10",
                  "font-semibold text-on-surface focus-visible:ring-2 focus-visible:ring-primary",
                  "dark:border-white/10 dark:bg-surface-container",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {productFilters.sortOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategorySelect("all")}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold transition-all sm:text-sm",
            allSelected
              ? "bg-primary text-on-primary shadow-sm shadow-primary/25"
              : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/35 hover:text-on-surface dark:bg-surface-container dark:ring-white/10",
          )}
        >
          সব
        </button>
        {productFilters.categories.map((option) => {
          const active =
            !allSelected &&
            (categories?.length ?? 0) === 1 &&
            categories?.[0] === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onCategorySelect(option.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-all sm:text-sm",
                active
                  ? "bg-primary text-on-primary shadow-sm shadow-primary/25"
                  : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/35 hover:text-on-surface dark:bg-surface-container dark:ring-white/10",
              )}
            >
              {categoryLabels[option.id]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
