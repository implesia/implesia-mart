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
      {/* Mobile / tablet: horizontal chips */}
      <div className="lg:hidden">
        <p className="mb-2.5 text-sm font-semibold text-on-surface">
          {faqsCopy.sidebar.title}
        </p>
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
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:border-primary/40 hover:text-primary",
                )}
              >
                <MaterialIcon name={opt.icon} className="text-[16px]" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: sticky sidebar */}
      <div className="sticky top-28 hidden overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest lg:block dark:border-white/10 dark:bg-surface-container">
        <div className="border-b border-outline-variant/30 bg-surface-container-low/80 px-5 py-5 dark:border-white/10">
          <h2 className="text-base font-semibold text-on-surface">
            {faqsCopy.sidebar.title}
          </h2>
          <p className="mt-1 text-xs text-outline">{faqsCopy.sidebar.subtitle}</p>
        </div>

        <nav className="flex flex-col gap-1 p-3" aria-label="FAQ ক্যাটাগরি">
          {options.map((opt) => {
            const active = activeCategory === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-primary/15 text-primary" : "bg-surface-container text-outline",
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
