"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";

type BreadcrumbItem = { label: string; href?: string };

export function ProductBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-label-sm text-outline sm:mb-7">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const content = item.href ? (
          <Link href={item.href} className="transition-colors hover:text-primary">
            {item.label}
          </Link>
        ) : (
          <span className={cn("font-semibold", isLast && "text-on-surface")}>
            {item.label}
          </span>
        );

        return (
          <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-2">
            {content}
            {!isLast ? (
              <MaterialIcon name="chevron_right" className="text-[14px] text-outline" />
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}

