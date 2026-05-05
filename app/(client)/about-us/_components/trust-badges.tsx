"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function TrustBadges({ className }: { className?: string }) {
  const { trust } = aboutCopy;

  return (
    <section className={cn("bg-surface-container-low py-xl", className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="font-headline-md text-primary">{trust.title}</h2>
          <p className="mt-4 font-body-md text-on-surface-variant">{trust.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
          {trust.badges.map((b) => (
            <Card
              key={b.title}
              className="border-border/60 bg-card shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
                  <MaterialIcon name={b.icon} className="text-3xl text-primary" filled />
                </div>
                <h4 className="text-center font-label-md text-primary">{b.title}</h4>
                <p className="mt-2 text-center text-sm text-on-surface-variant">
                  {b.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

