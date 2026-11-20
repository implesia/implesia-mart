"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type BreadcrumbItem = { label: string; href?: string };

export function ProductBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-xs text-neutral-500 sm:gap-1.5 dark:text-neutral-400"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const content = item.href ? (
          <Link
            href={item.href}
            className="inline-flex items-center rounded py-0.5 font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={cn("font-bold", isLast ? "text-neutral-900 dark:text-white" : "font-medium text-neutral-500")}
            aria-current={isLast ? "page" : undefined}
          >
            {item.label}
          </span>
        );

        return (
          <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1 sm:gap-1.5">
            {content}
            {!isLast ? (
              <MaterialIcon name="chevron_right" className="text-[14px] text-neutral-400" />
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
