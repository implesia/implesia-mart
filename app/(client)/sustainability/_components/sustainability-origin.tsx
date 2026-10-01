"use client";

import Image from "next/image";

import { useSustainabilitySections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";

export function SustainabilityOrigin({ className }: { className?: string }) {
  const { origin } = useSustainabilitySections();

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-3.5 sm:space-y-4">
            <p className="text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
              {origin.eyebrow}
            </p>

            <h2 className="text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {origin.title}
            </h2>

            <p className="text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
              {origin.body}
            </p>

            <blockquote className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 text-sm leading-relaxed text-neutral-700 italic sm:px-5">
              {origin.quote}
            </blockquote>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {origin.images.filter(isContentActive).map((image) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200/90 bg-white sm:aspect-4/5"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1024px) 45vw, 24vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
