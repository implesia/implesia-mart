"use client";

import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

function Stars() {
  return (
    <div className="mb-6 flex gap-1 text-tertiary">
      {Array.from({ length: 5 }).map((_, idx) => (
        <MaterialIcon key={idx} name="star" className="text-[20px]" filled />
      ))}
    </div>
  );
}

export function SustainabilityTrust({ className }: { className?: string }) {
  const { trust } = sustainabilityCopy;

  return (
    <section className={cn("bg-surface-container py-xl", className)}>
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="flex flex-col gap-12 md:flex-row">
          {trust.testimonials.map((t) => (
            <Card
              key={t.name}
              className="w-full border-border/70 bg-card shadow-sm md:w-1/2"
              style={{ borderLeftWidth: 4, borderLeftColor: "var(--color-primary)" }}
            >
              <CardContent className="p-12">
                <Stars />
                <p className="mb-8 font-headline-sm italic text-primary">“{t.quote}”</p>

                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-surface-container-high">
                    <Image src={t.avatarSrc} alt={t.avatarAlt} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-label-md">{t.name}</h4>
                    <p className="text-xs text-on-surface-variant">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

