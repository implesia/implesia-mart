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

const SORT_LABELS: Record<SortId, string> = {
  popularity: "Most Popular",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  newest: "New Arrivals",
};

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
  activeFilterCount?: number;
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
  activeFilterCount = 0,
}: ProductsToolbarProps) {
  const allSelected = !activeCategory;
  const chips = categoryChips(categoryTree, activeCategory);

  return (
    <div className={cn("mb-3 space-y-2.5 sm:mb-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-2.5 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl dark:text-white">
            {title}
          </h1>
          <span className="inline-flex items-center rounded-full border border-neutral-200/80 bg-white px-2.5 py-0.5 text-xs font-semibold text-neutral-600 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
            {totalLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={onOpenMobileFilters}
            aria-expanded={filtersOpen}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold sm:flex-none lg:hidden",
              "border border-neutral-200/90 bg-white text-neutral-800 shadow-2xs",
              "transition-colors hover:border-primary/50 hover:text-primary",
              "dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-200",
            )}
          >
            <MaterialIcon name="tune" className="text-[17px] text-primary" />
            <span>Filters</span>
            {activeFilterCount > 0 ? (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          {/* Sort Select */}
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
            <span className="hidden text-xs font-semibold text-neutral-500 lg:inline dark:text-neutral-400">
              Sort by:
            </span>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (!value) return;
                onSortChange(value as SortId);
              }}
            >
              <SelectTrigger
                aria-label="Sort products"
                className={cn(
                  "h-10 w-full min-w-[10.5rem] rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-semibold text-neutral-900 shadow-2xs",
                  "hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-primary/20",
                  "dark:border-white/10 dark:bg-[#121a19] dark:text-white sm:w-auto",
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MaterialIcon name="swap_vert" className="text-[16px] text-neutral-500 dark:text-neutral-400" />
                  <SelectValue>
                    {(value) => SORT_LABELS[value as SortId] ?? "Most Popular"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="force-light rounded-xl border border-neutral-200/90 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#121a19]">
                {productFilters.sortOptions.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={option.id}
                    className="rounded-lg text-xs font-medium cursor-pointer py-2 focus:bg-neutral-100 dark:focus:bg-white/10"
                  >
                    {SORT_LABELS[option.id] ?? option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Category chips — horizontal scroll on mobile & tablet */}
      <div className="-mx-3 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] min-[400px]:-mx-4 min-[400px]:px-4 sm:mx-0 sm:overflow-visible sm:px-0 lg:hidden [&::-webkit-scrollbar]:hidden">
        <div
          role="group"
          aria-label="Categories"
          className="flex w-max gap-1.5 py-0.5 sm:w-auto sm:flex-wrap sm:gap-2"
        >
          <button
            type="button"
            onClick={() => onCategorySelect("all")}
            aria-pressed={allSelected}
            className={cn(
              "inline-flex h-8.5 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition-all",
              allSelected
                ? "bg-neutral-950 text-white shadow-xs dark:bg-white dark:text-neutral-950"
                : "bg-white text-neutral-700 border border-neutral-200/80 hover:border-neutral-300 hover:text-neutral-950 dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-300",
            )}
          >
            All Categories
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
                  "inline-flex h-8.5 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-neutral-950 text-white shadow-xs dark:bg-white dark:text-neutral-950"
                    : "bg-white text-neutral-700 border border-neutral-200/80 hover:border-neutral-300 hover:text-neutral-950 dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-300",
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
