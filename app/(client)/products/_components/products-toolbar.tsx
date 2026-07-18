"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { productFilters } from "../../_data/products/products";

type ProductsToolbarProps = {
  className?: string;
  totalLabel?: string;
};

export function ProductsToolbar({
  className,
  totalLabel = "সব ১০টি পণ্য দেখানো হচ্ছে",
}: ProductsToolbarProps) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div>
        <h1 className="font-display-lg text-primary">ট্রেন্ডিং গ্যাজেট কালেকশন</h1>
        <p className="mt-2 font-label-md tracking-wide text-muted-foreground">
          {totalLabel}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">সাজান:</span>
        <Select defaultValue={productFilters.sortOptions[0].id}>
          <SelectTrigger className="h-10 rounded-lg border-0 bg-surface-container-low pr-10 font-semibold text-primary focus-visible:ring-2 focus-visible:ring-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {productFilters.sortOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

