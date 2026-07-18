"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityImpact({ className }: { className?: string }) {
  const { impact } = sustainabilityCopy;

  return (
    <section className={cn("mx-auto max-w-7xl px-6 py-xl md:px-12", className)}>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        {impact.stats.map((s) => (
          <Card key={s.label} className="border-border/70 bg-card">
            <CardContent className="p-12 text-center">
              <div className="mb-2 font-display-lg text-primary">{s.value}</div>
              <div className="font-label-md tracking-widest text-on-surface-variant uppercase">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

