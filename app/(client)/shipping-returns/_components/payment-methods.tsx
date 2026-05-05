"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { shippingReturnsCopy } from "../../_data/shipping/shipping-returns";

export function PaymentMethods({ className }: { className?: string }) {
  const { payment } = shippingReturnsCopy;

  return (
    <section id="payment" className={cn("scroll-mt-32", className)}>
      <h2 className="mb-8 flex items-center gap-3 border-b border-border/60 pb-4 font-headline-md text-on-surface">
        <MaterialIcon name="payments" className="text-primary" />
        {payment.heading}
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {payment.cards.map((c) => (
          <Card
            key={c.title}
            className="group relative overflow-hidden rounded-2xl border-border/60 bg-card p-0 transition-all duration-300 hover:shadow-xl"
          >
            <CardContent className="p-8">
              <div className="mb-12 flex items-start justify-between">
                <MaterialIcon name={c.icon} className="text-4xl text-primary" />
                <span
                  className={cn(
                    "rounded px-2 py-1 text-xs font-bold",
                    c.badge.variant === "success"
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container-low text-outline"
                  )}
                >
                  {c.badge.label}
                </span>
              </div>

              <h3 className="mb-2 text-xl font-bold text-on-surface">{c.title}</h3>
              <p className="mb-6 text-on-surface-variant">{c.body}</p>

              {c.footnote ? (
                <p className="text-xs font-bold tracking-widest text-primary uppercase">
                  {c.footnote}
                </p>
              ) : (
                <div className="flex gap-3 opacity-60 grayscale transition-all group-hover:grayscale-0">
                  <div className="h-6 w-10 rounded bg-surface-container-high" />
                  <div className="h-6 w-10 rounded bg-surface-container-high" />
                  <div className="h-6 w-10 rounded bg-surface-container-high" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

