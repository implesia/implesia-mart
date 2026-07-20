"use client";

import { cn } from "@/lib/utils";
import { buildPaginationItems } from "@/lib/pagination";

import { MaterialIcon } from "./material-icon";

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Optional “Showing X–Y of Z” style label */
  summary?: string;
  /** Accessible name for the nav landmark */
  ariaLabel?: string;
};

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  summary,
  ariaLabel = "পেজিনেশন",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPaginationItems(page, totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  function goTo(next: number) {
    if (next < 1 || next > totalPages || next === page) return;
    onPageChange(next);
  }

  return (
    <nav
      className={cn(
        "w-full border-t border-outline-variant/30 pt-6 dark:border-white/10 sm:pt-8",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-center text-sm text-on-surface-variant sm:text-left">
          {summary ?? (
            <>
              পৃষ্ঠা <span className="font-medium text-on-surface">{page}</span> / {totalPages}
            </>
          )}
        </p>

        <div className="flex items-center justify-center gap-1.5 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={!canPrev}
            aria-label="আগের পৃষ্ঠা"
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium sm:h-10 sm:px-3",
              "text-on-surface-variant transition-colors duration-200",
              "hover:bg-surface-container-low hover:text-on-surface",
              "disabled:pointer-events-none disabled:opacity-35",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
            )}
          >
            <MaterialIcon name="arrow_back" className="text-[18px]" />
            <span className="hidden sm:inline">আগের</span>
          </button>

          <ul className="flex items-center gap-1">
            {items.map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <li
                    key={`ellipsis-${index}`}
                    className="flex h-9 w-6 items-center justify-center text-outline sm:h-10"
                    aria-hidden
                  >
                    …
                  </li>
                );
              }

              const isActive = item === page;

              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => goTo(item)}
                    aria-label={`পৃষ্ঠা ${item}`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums sm:h-10 sm:min-w-10",
                      "transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                      isActive
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                    )}
                  >
                    {item}
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={!canNext}
            aria-label="পরের পৃষ্ঠা"
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium sm:h-10 sm:px-3",
              "text-on-surface-variant transition-colors duration-200",
              "hover:bg-surface-container-low hover:text-on-surface",
              "disabled:pointer-events-none disabled:opacity-35",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
              canNext && "text-primary hover:bg-primary/8 hover:text-primary",
            )}
          >
            <span className="hidden sm:inline">পরের</span>
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </button>
        </div>
      </div>
    </nav>
  );
}
