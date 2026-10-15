"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type BreadcrumbItem = { label: string; href?: string };

export function ProductBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="ব্রেডক্রাম্ব"
      className="mb-1 flex flex-wrap items-center gap-1 text-[13px] text-neutral-600 sm:mb-2 sm:gap-1.5 lg:mb-2.5"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const content = item.href ? (
          <Link
            href={item.href}
            className="-mx-1 inline-flex min-h-11 items-center rounded px-1 transition-colors hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            {item.label}
          </Link>
        ) : (
          <span
            className={cn("font-semibold", isLast && "text-neutral-950")}
            aria-current={isLast ? "page" : undefined}
          >
            {item.label}
          </span>
        );

        return (
          <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5 sm:gap-2">
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

