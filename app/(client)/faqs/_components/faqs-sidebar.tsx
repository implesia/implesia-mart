"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { faqsCopy } from "../../_data/faqs/faqs";

export function FaqsSidebar({ className }: { className?: string }) {
  const { sidebar } = faqsCopy;

  return (
    <aside className={cn("hidden w-72 shrink-0 lg:block", className)}>
      <div className="sticky top-28 overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border/60 bg-surface-container-low p-8">
          <h2 className="font-headline-sm text-on-surface">{sidebar.title}</h2>
          <p className="mt-xs font-label-sm text-outline">{sidebar.subtitle}</p>
        </div>

        <nav className="flex flex-col gap-2 p-4">
          {sidebar.categories.map((c, idx) => {
            const active = idx === 0;
            return (
              <Link
                key={c.id}
                href={c.id === "contact" ? "/contact-us" : "#"}
                className={cn(
                  "flex items-center gap-md rounded-lg px-4 py-3 transition-transform duration-200",
                  "hover:translate-x-1",
                  active
                    ? "bg-surface-container-low text-primary font-semibold"
                    : "text-outline hover:bg-surface-container-low/60",
                )}
              >
                <MaterialIcon name={c.icon} />
                <span className="text-sm font-light">{c.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
