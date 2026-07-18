"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { productFilters } from "../../_data/products/products";

type ProductsFiltersProps = {
  className?: string;
};

export function ProductsFilters({ className }: ProductsFiltersProps) {
  return (
    <aside
      className={cn(
        "custom-scrollbar sticky top-16 hidden h-[calc(100vh-64px)] w-72 flex-col gap-8 overflow-y-auto border-r border-border px-8 pt-12 lg:flex",
        className
      )}
    >
      <div>
        <h2 className="text-lg font-bold text-foreground">ফিল্টার</h2>
        <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
          রিজাল্ট সীমিত করুন
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <div className="mb-4 flex items-center gap-3 text-primary">
            <MaterialIcon name="payments" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              দামের রেঞ্জ
            </span>
          </div>
          <div className="px-4">
            <Slider defaultValue={[0, 5000]} min={0} max={5000} />
            <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
              <span>৳0</span>
              <span>৳5,000+</span>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3 text-primary">
            <MaterialIcon name="inventory_2" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              এভেইলেবিলিটি
            </span>
          </div>
          <div className="px-4">
            {productFilters.availability.map((a) => (
              <label
                key={a.id}
                className="group flex cursor-pointer items-center gap-3"
              >
                <Checkbox defaultChecked />
                <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  {a.label}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
