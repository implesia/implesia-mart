"use client";

import type { FaqCategories } from "@/lib/mart-api/faq-categories";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type FaqsCategoriesProps = {
  categories: FaqCategories | null;
  activeCategory: string;
  onChange: (id: string) => void;
  className?: string;
};

export function FaqsCategories({
  categories,
  activeCategory,
  onChange,
  className,
}: FaqsCategoriesProps) {
  if (!categories?.isActive) return null;

  const options = [
    {
      id: "all",
      label: categories.allLabel.trim() || "All",
      icon: categories.allIcon || "grid_view",
    },
    ...categories.items.filter((item) => item.label.trim() && item.isActive !== false),
  ];

  return (
    <aside className={cn("min-w-0", className)}>
      <div className="lg:hidden">
        {categories.title.trim() ? (
          <p className="mb-2.5 text-sm font-semibold text-neutral-950">{categories.title}</p>
        ) : null}
        <div
          className={cn(
            "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {options.map((option) => {
            const active = activeCategory === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-neutral-200/90 bg-white text-neutral-600 hover:border-primary/40 hover:text-neutral-950",
                )}
              >
                <MaterialIcon name={option.icon} className="text-[16px]" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky top-28 hidden overflow-hidden rounded-2xl border border-neutral-200/90 bg-white lg:block">
        <div className="border-b border-neutral-200 px-4 py-3.5">
          {categories.title.trim() ? (
            <h2 className="text-base font-semibold text-neutral-950">{categories.title}</h2>
          ) : null}
          {categories.subtitle.trim() ? (
            <p className="mt-1 text-xs text-neutral-500">{categories.subtitle}</p>
          ) : null}
        </div>
        <nav
          className="flex flex-col gap-1 p-2.5"
          aria-label={categories.navLabel.trim() || "Categories"}
        >
          {options.map((option) => {
            const active = activeCategory === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "font-medium text-neutral-600 hover:bg-[#f5f6f8] hover:text-neutral-950",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    active ? "bg-primary/15 text-primary" : "bg-[#f5f6f8] text-neutral-500",
                  )}
                >
                  <MaterialIcon name={option.icon} className="text-[18px]" />
                </span>
                <span className="min-w-0 leading-snug">{option.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
