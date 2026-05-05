"use client";

import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { shippingReturnsCopy } from "../../_data/shipping/shipping-returns";

function toneClasses(tone: "tertiary" | "secondary" | "primary") {
  if (tone === "tertiary") {
    return {
      wrap: "bg-tertiary-fixed border-tertiary-container/10",
      head: "text-tertiary",
      body: "text-on-tertiary-fixed-variant",
      pill: "bg-tertiary text-tertiary-fixed-dim",
    };
  }
  if (tone === "secondary") {
    return {
      wrap: "bg-secondary-fixed border-secondary-container/10",
      head: "text-secondary",
      body: "text-on-secondary-fixed-variant",
      pill: "bg-secondary-container text-on-secondary-container",
    };
  }
  return {
    wrap: "bg-primary-fixed border-primary-container/10",
    head: "text-primary",
    body: "text-on-primary-fixed-variant",
    pill: "bg-primary-container text-on-primary-container",
  };
}

export function ReturnsPolicy({ className }: { className?: string }) {
  const { returns } = shippingReturnsCopy;

  return (
    <section id="returns" className={cn("scroll-mt-32", className)}>
      <h2 className="mb-8 flex items-center gap-3 border-b border-border/60 pb-4 font-headline-md text-on-surface">
        <MaterialIcon name="keyboard_return" className="text-primary" />
        {returns.heading}
      </h2>

      <Card className="mb-8 overflow-hidden rounded-2xl border-border/60 bg-card">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-12 md:flex-row">
            <div className="aspect-square w-full overflow-hidden rounded-xl shadow-lg md:w-1/3">
              <Image
                src={returns.imageSrc}
                alt={returns.imageAlt}
                width={600}
                height={600}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="mb-4 text-2xl font-bold text-on-surface">{returns.eligibilityTitle}</h3>
              <ul className="space-y-4">
                {returns.rules.map((r) => (
                  <li key={r} className="flex items-start gap-3 text-on-surface-variant">
                    <MaterialIcon name="check_circle" className="mt-1 text-primary text-sm" filled />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {returns.special.map((n) => {
          const tone = toneClasses(n.tone);
          return (
            <div
              key={n.title}
              className={cn("rounded-xl border p-6", tone.wrap)}
            >
              <div className={cn("mb-3 flex items-center gap-2", tone.head)}>
                <MaterialIcon name={n.icon} />
                <span className="text-xs font-bold tracking-widest uppercase">{n.title}</span>
              </div>
              <p className={cn("rounded-lg p-3 text-sm", tone.pill)}>
                {n.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

