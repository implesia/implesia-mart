"use client";

import { cn } from "@/lib/utils";

import { shippingReturnsCopy } from "../../_data/shipping/shipping-returns";

export function MiniFaq({ className }: { className?: string }) {
  const { miniFaq } = shippingReturnsCopy;

  return (
    <section className={cn("pt-12", className)}>
      <h3 className="mb-8 text-center font-headline-sm text-on-surface">{miniFaq.title}</h3>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {miniFaq.items.map((it) => (
          <div key={it.q}>
            <h4 className="mb-2 font-bold text-primary">{it.q}</h4>
            <p className="text-sm text-on-surface-variant">{it.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

