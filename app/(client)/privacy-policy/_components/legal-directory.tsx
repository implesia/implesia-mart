"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { privacyPolicyCopy } from "../../_data/privacy/privacy-policy";

export function LegalDirectory({
  activeId,
  className,
}: {
  activeId?: string;
  className?: string;
}) {
  return (
    <aside className={cn("md:col-span-3", className)}>
      <div className="sticky top-32 w-full rounded-lg border border-border/70 bg-surface-container-low p-4 shadow-sm md:w-64">
        <div className="mb-4 px-4">
          <p className="font-label-sm tracking-widest text-outline uppercase">Legal Directory</p>
          <p className="text-[10px] text-outline/70">Last updated {privacyPolicyCopy.lastUpdated}</p>
        </div>

        {privacyPolicyCopy.nav.map((item) => {
          const isActive = activeId ? activeId === item.id : item.id === "introduction";
          return (
            <Link
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "flex items-center gap-sm px-4 py-3 font-label-md transition-transform duration-200",
                "rounded-md hover:translate-x-1 hover:bg-surface-container-high",
                isActive
                  ? "bg-primary/10 text-primary border-l-4 border-primary"
                  : "text-outline"
              )}
            >
              <MaterialIcon name={item.icon} className="text-[20px]" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

