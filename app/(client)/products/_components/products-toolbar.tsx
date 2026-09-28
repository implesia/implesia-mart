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
    <div className={cn("mb-3 space-y-3 sm:mb-4 sm:space-y-3.5 lg:mb-4", className)}>
      <div className="flex flex-col gap-2.5 sm:gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10px] font-semibold tracking-[0.18em] text-primary uppercase sm:text-xs">
            ক্যাটালগ
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-on-surface sm:text-xl md:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant sm:text-sm">
            {totalLabel}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto md:shrink-0">
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold sm:h-10 sm:flex-none sm:px-3.5 lg:hidden",
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
                  "h-9 w-full min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest pr-9 sm:h-10",
                  "font-semibold text-on-surface focus-visible:ring-2 focus-visible:ring-primary",
                  "dark:border-white/10 dark:bg-surface-container",
                  "sm:min-w-[10.5rem] sm:w-auto",
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
      <div className="-mx-3 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] min-[400px]:-mx-4 min-[400px]:px-4 sm:mx-0 sm:overflow-visible sm:px-0 lg:hidden [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap sm:gap-2">
          <button
            type="button"
            onClick={() => onCategorySelect("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm",
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
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm",
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
