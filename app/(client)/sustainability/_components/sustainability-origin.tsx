"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityOrigin({ className }: { className?: string }) {
  const { origin } = sustainabilityCopy;

  return (
    <section className={cn("mx-auto max-w-[1440px] px-6 py-xl md:px-12", className)}>
      <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
        <div className="space-y-8">
          <span className="font-label-md tracking-widest text-primary uppercase">{origin.eyebrow}</span>
          <h2 className="font-display-lg text-primary">{origin.title}</h2>
          <p className="font-body-lg text-on-surface-variant">{origin.body}</p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {origin.images.map((img) => (
              <div key={img.src} className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={img.src} alt={img.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="group relative">
          <div className="relative h-[520px] overflow-hidden rounded-xl shadow-sm transition-shadow duration-500 group-hover:shadow-lg lg:h-[600px]">
            <Image
              src={origin.featureImage.src}
              alt={origin.featureImage.alt}
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute -bottom-6 -left-6 hidden max-w-xs rounded-lg bg-tertiary p-8 text-on-tertiary lg:block">
            <p className="font-headline-sm italic">{origin.quote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

