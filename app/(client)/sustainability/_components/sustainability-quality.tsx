import Image from "next/image";

import {
  qualityIcon,
  type SustainabilityQuality,
} from "@/lib/mart-api/sustainability-quality";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function SustainabilityQuality({
  quality,
  className,
}: {
  quality: SustainabilityQuality;
  className?: string;
}) {
  const steps = quality.steps.filter((step) => step.isActive);
  const badges = quality.badges.filter((badge) => badge.isActive);
  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="order-2 lg:order-1 relative aspect-4/5 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white sm:aspect-[5/4] lg:aspect-4/5">
            {quality.image.src ? (
              <Image
                src={quality.image.src}
                alt={quality.image.alt}
                fill
                sizes="(max-width: 1024px) 92vw, 42vw"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="order-1 lg:order-2">
            {quality.title.trim() ? (
              <h2 className="text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                {quality.title}
              </h2>
            ) : null}
            {quality.body.trim() ? (
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                {quality.body}
              </p>
            ) : null}

            <ol className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-neutral-700">{step.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
                >
                  <MaterialIcon name={qualityIcon(badge.icon)} className="text-[16px] text-primary" />
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
