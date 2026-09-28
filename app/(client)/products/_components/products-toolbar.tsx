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
    <div className={cn("mb-5 space-y-4 sm:mb-7 sm:space-y-5 lg:mb-8", className)}>
      <div className="flex flex-col gap-3.5 sm:gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-semibold tracking-[0.18em] text-primary uppercase sm:mb-1.5 sm:text-xs">
            কালেকশন
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-on-surface sm:text-2xl md:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant sm:mt-1.5 sm:text-sm">
            {totalLabel}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-2.5 md:shrink-0">
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold sm:flex-none sm:px-3.5 lg:hidden",
              "border border-outline-variant/40 bg-surface-container-lowest text-on-surface",
              "dark:border-white/10 dark:bg-surface-container",
              "transition-colors hover:border-primary/35 hover:text-primary",
            )}
          >
            <MaterialIcon name="tune" className="text-[18px]" />
            ফিল্টার
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <span className="hidden text-sm text-on-surface-variant lg:inline">সাজান</span>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (!value) return;
                onSortChange(value as SortId);
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-10 w-full min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest pr-9",
                  "font-semibold text-on-surface focus-visible:ring-2 focus-visible:ring-primary",
                  "dark:border-white/10 dark:bg-surface-container",
                  "sm:min-w-[11rem] sm:w-auto",
                )}
              >
                <SelectValue>
                  {(value) =>
                    productFilters.sortOptions.find((option) => option.id === value)
                      ?.label ?? "জনপ্রিয়তা"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="force-light">
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

      {/* Category chips — horizontal scroll on small screens */}
      <div className="-mx-4 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          <button
            type="button"
            onClick={() => onCategorySelect("all")}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm",
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
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm",
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
    </div>
  );
}
