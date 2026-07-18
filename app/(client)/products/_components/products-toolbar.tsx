"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { productFilters } from "../../_data/products/products";

type SortId = (typeof productFilters.sortOptions)[number]["id"];

type ProductsToolbarProps = {
  className?: string;
  totalLabel: string;
  sort: SortId;
  onSortChange: (sort: SortId) => void;
};

export function ProductsToolbar({
  className,
  totalLabel,
  sort,
  onSortChange,
}: ProductsToolbarProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl lg:text-[2rem]">
          ট্রেন্ডিং গ্যাজেট কালেকশন
        </h1>
        <p className="mt-1.5 text-sm tracking-wide text-muted-foreground">
          {totalLabel}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">সাজান:</span>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (!value) return;
            onSortChange(value as SortId);
          }}
        >
          <SelectTrigger className="h-10 rounded-lg border-0 bg-surface-container-low pr-10 font-semibold text-primary focus-visible:ring-2 focus-visible:ring-primary">
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
  );
}
