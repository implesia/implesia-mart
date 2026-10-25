"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryTile } from "@/lib/mart-api/categories";
import { categoryChips } from "@/lib/mart-api/category-tree";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  productFilters,
  type ProductCategoryId,
} from "../../_data/products/catalog-meta";

type SortId = (typeof productFilters.sortOptions)[number]["id"];

type ProductsToolbarProps = {
  className?: string;
  title: string;
  totalLabel: string;
  sort: SortId;
  onSortChange: (sort: SortId) => void;
  categoryTree: CategoryTile[];
  activeCategory?: ProductCategoryId;
  onCategorySelect: (id: ProductCategoryId | "all") => void;
  onOpenMobileFilters: () => void;
  filtersOpen: boolean;
};

export function ProductsToolbar({
  className,
  title,
  totalLabel,
  sort,
  onSortChange,
  categoryTree,
  activeCategory,
  onCategorySelect,
  onOpenMobileFilters,
  filtersOpen,
}: ProductsToolbarProps) {
  const allSelected = !activeCategory;
  const chips = categoryChips(categoryTree, activeCategory);

  return (
    <div className={cn("mb-2 space-y-2 sm:mb-2.5", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p aria-hidden="true" className="text-lg font-semibold text-on-surface sm:text-xl">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-on-surface-variant">{totalLabel}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
            <button
              type="button"
              onClick={onOpenMobileFilters}
              aria-expanded={filtersOpen}
              className={cn(
                "inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold sm:flex-none sm:px-3.5 lg:hidden",
                "border border-outline-variant/40 bg-surface-container-lowest text-on-surface",
                "dark:border-white/10 dark:bg-surface-container",
                "transition-colors hover:border-primary/35 hover:text-primary",
              )}
            >
              <MaterialIcon name="tune" className="text-[18px]" />
              ফিল্টার
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <span className="hidden text-sm text-on-surface-variant lg:inline">
                সাজান
              </span>
              <Select
                value={sort}
                onValueChange={(value) => {
                  if (!value) return;
                  onSortChange(value as SortId);
                }}
              >
                <SelectTrigger
                  aria-label="সাজান"
                  className={cn(
                    "h-11 w-full min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest pr-9",
                    "font-semibold text-on-surface focus-visible:ring-2 focus-visible:ring-primary",
                    "dark:border-white/10 dark:bg-surface-container",
                    "sm:min-w-[10.5rem] sm:w-auto",
                  )}
                >
                  <SelectValue>
                    {(value) =>
                      productFilters.sortOptions.find(
                        (option) => option.id === value,
                      )?.label ?? "জনপ্রিয়তা"
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
      </div>

      {/* Category chips — horizontal scroll on small screens */}
      <div className="-mx-3 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] min-[400px]:-mx-4 min-[400px]:px-4 sm:mx-0 sm:overflow-visible sm:px-0 lg:hidden [&::-webkit-scrollbar]:hidden">
        <div
          role="group"
          aria-label="Categories"
          className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap sm:gap-2"
        >
          <button
            type="button"
            onClick={() => onCategorySelect("all")}
            aria-pressed={allSelected}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold transition-colors",
              allSelected
                ? "bg-primary text-on-primary shadow-sm shadow-primary/25"
                : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/35 hover:text-on-surface dark:bg-surface-container dark:ring-white/10",
            )}
          >
            সব
          </button>
          {chips.map((option) => {
            const active = option.slug === activeCategory;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onCategorySelect(option.slug)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-on-primary shadow-sm shadow-primary/25"
                    : "bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/35 hover:text-on-surface dark:bg-surface-container dark:ring-white/10",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
