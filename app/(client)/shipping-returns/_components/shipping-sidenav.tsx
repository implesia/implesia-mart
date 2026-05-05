"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { shippingReturnsCopy } from "../../_data/shipping/shipping-returns";

export function ShippingSideNav({ className }: { className?: string }) {
  const { nav } = shippingReturnsCopy;

  return (
    <aside className={cn("hidden lg:block", className)}>
      <div className="sticky top-24 w-72 rounded-lg border border-border/60 bg-surface-container-low p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-6 px-4">
          <h3 className="font-headline-sm text-on-surface">{nav.title}</h3>
          <p className="mt-1 font-label-sm tracking-widest text-outline uppercase">
            {nav.subtitle}
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          {nav.items.map((it, idx) => (
            <Link
              key={it.id}
              href={`#${it.id}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-3 transition-all",
                idx === 0
                  ? "bg-card text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:translate-x-1 hover:bg-primary/5"
              )}
            >
              <MaterialIcon name={it.icon} />
              <span className={cn(idx === 0 ? "font-semibold" : "font-medium")}>{it.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

