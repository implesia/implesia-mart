"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityOrganic({ className }: { className?: string }) {
  const { organic } = sustainabilityCopy;

  return (
    <section className={cn("mx-auto max-w-7xl px-6 py-xl md:px-12", className)}>
      <div className="flex flex-col items-center gap-16 lg:flex-row">
        <div className="order-2 w-full lg:order-1 lg:w-1/2">
          <div className="relative overflow-hidden rounded-xl shadow-lg">
            <Image src={organic.imageSrc} alt={organic.imageAlt} width={1200} height={900} className="h-auto w-full object-cover" />
          </div>
        </div>

        <div className="order-1 w-full space-y-8 lg:order-2 lg:w-1/2">
          <h2 className="font-display-lg text-primary">{organic.title}</h2>
          <p className="font-body-lg text-on-surface-variant">{organic.body}</p>

          <div className="space-y-6">
            {organic.steps.map((s, idx) => (
              <div key={s} className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  {idx + 1}
                </span>
                <p className="font-label-md">{s}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 pt-6">
            {organic.badges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-2 rounded-full bg-on-primary-container/20 px-4 py-2 text-xs font-bold text-primary"
              >
                <MaterialIcon name={b.icon} className="text-sm" filled />
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

