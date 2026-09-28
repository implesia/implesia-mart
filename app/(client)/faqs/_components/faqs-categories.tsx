"use client";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { faqsCopy } from "../../_data/faqs/faqs";

type FaqsCategoriesProps = {
  activeCategory: string;
  onChange: (id: string) => void;
  className?: string;
};

const ALL_ID = "all";

export function FaqsCategories({
  activeCategory,
  onChange,
  className,
}: FaqsCategoriesProps) {
  const options = [
    {
      id: ALL_ID,
      label: faqsCopy.sidebar.allLabel,
      icon: "grid_view",
    },
    ...faqsCopy.categories,
  ];

  return (
    <aside className={cn("min-w-0", className)}>
      <div className="lg:hidden">
        <p className="mb-2.5 text-sm font-semibold text-neutral-950">{faqsCopy.sidebar.title}</p>
        <div
          className={cn(
            "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {options.map((opt) => {
            const active = activeCategory === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-neutral-200/90 bg-white text-neutral-600 hover:border-primary/40 hover:text-neutral-950",
                )}
              >
                <MaterialIcon name={opt.icon} className="text-[16px]" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky top-28 hidden overflow-hidden rounded-2xl border border-neutral-200/90 bg-white lg:block">
        <div className="border-b border-neutral-200 px-4 py-3.5">
          <h2 className="text-base font-semibold text-neutral-950">{faqsCopy.sidebar.title}</h2>
          <p className="mt-1 text-xs text-neutral-500">{faqsCopy.sidebar.subtitle}</p>
        </div>

        <nav className="flex flex-col gap-1 p-2.5" aria-label="FAQ ক্যাটাগরি">
          {options.map((opt) => {
            const active = activeCategory === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
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
                  <MaterialIcon name={opt.icon} className="text-[18px]" />
                </span>
                <span className="min-w-0 leading-snug">{opt.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
