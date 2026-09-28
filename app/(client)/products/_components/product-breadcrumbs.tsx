"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type BreadcrumbItem = { label: string; href?: string };

export function ProductBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-2.5 flex flex-wrap items-center gap-1 text-xs text-neutral-500 sm:mb-3 sm:gap-1.5 lg:mb-3.5">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const content = item.href ? (
          <Link href={item.href} className="transition-colors hover:text-primary">
            {item.label}
          </Link>
        ) : (
          <span className={cn("font-semibold", isLast && "text-neutral-950")}>
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

