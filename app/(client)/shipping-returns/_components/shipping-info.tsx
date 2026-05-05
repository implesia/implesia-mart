"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { shippingReturnsCopy } from "../../_data/shipping/shipping-returns";

export function ShippingInfo({ className }: { className?: string }) {
  const { shipping } = shippingReturnsCopy;

  return (
    <section id="shipping" className={cn("scroll-mt-32", className)}>
      <h2 className="mb-8 flex items-center gap-3 border-b border-border/60 pb-4 font-headline-md text-on-surface">
        <MaterialIcon name="local_shipping" className="text-primary" />
        {shipping.heading}
      </h2>

      <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {shipping.cards.map((c) => (
          <Card
            key={c.title}
            className={cn(
              "border-border/60 shadow-sm transition-shadow hover:shadow-md",
              c.variant === "primary" ? "bg-primary-container text-on-primary-container" : "bg-card"
            )}
          >
            <CardContent className="p-8">
              <h4
                className={cn(
                  "mb-2 font-label-md tracking-wider uppercase",
                  c.variant === "primary" ? "opacity-80" : "text-primary"
                )}
              >
                {c.eyebrow}
              </h4>
              <p className={cn("mb-4 font-headline-md", c.variant === "primary" ? "" : "text-on-surface")}>
                {c.title}
              </p>
              <p className={cn("font-body-md", c.variant === "primary" ? "opacity-90" : "text-on-surface-variant")}>
                {c.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="p-8">
          <h3 className="mb-6 font-headline-sm text-on-surface">{shipping.timelinesTitle}</h3>
          <div className="space-y-6">
            {shipping.timelines.map((t) => (
              <div key={t.label} className="flex items-center justify-between rounded-lg bg-surface-container-low p-4">
                <span className="font-medium text-on-surface">{t.label}</span>
                <span className="rounded-full bg-primary/10 px-4 py-1 font-bold text-primary">
                  {t.value}
                </span>
              </div>
            ))}

            <div className="flex items-start gap-4 border-l-4 border-primary bg-primary/5 p-4">
              <MaterialIcon name={shipping.express.icon} className="text-primary" filled />
              <div>
                <p className="font-bold text-on-surface">{shipping.express.title}</p>
                <p className="text-sm text-on-surface-variant">{shipping.express.body}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

