import Image from "next/image";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityQuality({ className }: { className?: string }) {
  const { quality } = sustainabilityCopy;

  return (
    <section className={cn("w-full py-10 sm:py-14 lg:py-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 relative aspect-4/5 w-full overflow-hidden rounded-2xl ring-1 ring-outline-variant/30 sm:rounded-3xl lg:order-1 lg:aspect-square dark:ring-white/10">
            <Image
              src={quality.imageSrc}
              alt={quality.imageAlt}
              fill
              sizes="(max-width: 1024px) 90vw, 46vw"
              className="object-cover"
            />
          </div>

          <div className="order-1 space-y-6 lg:order-2">
            <h2 className="text-2xl leading-tight font-semibold text-primary sm:text-3xl lg:text-[2.15rem]">
              {quality.title}
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {quality.body}
            </p>

            <div className="space-y-4">
              {quality.steps.map((step, idx) => (
                <div key={step} className="flex items-center gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary sm:size-10 dark:bg-primary/15">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-on-surface sm:text-base">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {quality.badges.map((badge) => (
                <span
                  key={badge.label}
                  className="inline-flex items-center gap-2 rounded-full border border-warm-gold/30 bg-warm-gold/10 px-4 py-2 text-xs font-bold text-warm-gold"
                >
                  <MaterialIcon name={badge.icon} className="text-[16px]" filled />
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
