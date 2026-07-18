"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityCommitment({ className }: { className?: string }) {
  const { commitment } = sustainabilityCopy;

  return (
    <section className={cn("bg-surface-container-low py-xl", className)}>
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-16 text-center">
          <h2 className="font-display-lg text-primary">{commitment.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-on-surface-variant">{commitment.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
          {commitment.items.map((c) => (
            <Card
              key={c.title}
              className="group border-border/60 bg-card p-0 shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="flex flex-col items-center p-10 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container transition-transform group-hover:scale-110">
                  <MaterialIcon name={c.icon} className="text-3xl" filled />
                </div>
                <h3 className="mb-2 font-label-md text-primary">{c.title}</h3>
                <p className="text-sm text-on-surface-variant">{c.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

