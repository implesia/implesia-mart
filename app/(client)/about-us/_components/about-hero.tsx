"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { aboutCopy } from "../../_data/about/about";

export function AboutHero({ className }: { className?: string }) {
  const { hero } = aboutCopy;

  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0">
        <Image
          src={hero.imageSrc}
          alt={hero.imageAlt}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/70 to-background/0" />
      </div>

      <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-6 pt-10 pb-16 lg:min-h-[716px] lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-tertiary-fixed px-4 py-1 font-label-md text-on-tertiary-fixed">
            {hero.eyebrow}
          </span>
          <h1 className="mt-6 font-display-xl text-primary">{hero.title}</h1>
          <p className="mt-6 max-w-lg font-body-lg text-on-surface-variant">
            {hero.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}

