"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function AboutHero({ className }: { className?: string }) {
  const { hero } = aboutCopy;

  return (
    <section className={cn("w-full pb-5 sm:pb-6 lg:pb-7", className)}>
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl sm:rounded-3xl",
            "grid grid-cols-1 lg:grid-cols-12",
            "bg-[#062f2c]",
            "ring-1 ring-black/10",
            "shadow-[0_12px_32px_rgba(6,47,44,0.12)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_0%_0%,rgba(43,192,181,0.35),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(245,179,1,0.14),transparent_50%)]"
          />

          <div className="relative z-10 flex flex-col justify-center px-4 py-6 sm:px-7 sm:py-8 lg:col-span-7 lg:px-10 lg:py-10 xl:px-12">
            <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/90">
              <span className="size-1.5 shrink-0 rounded-full bg-warm-gold" />
              {hero.eyebrow}
            </span>

            <h1 className="mb-3 text-xl leading-tight font-semibold text-white sm:mb-4 sm:text-3xl lg:text-[2.35rem]">
              {hero.title}
            </h1>

            <p className="mb-5 max-w-xl text-sm leading-relaxed text-white/70 sm:mb-6 sm:text-base">
              {hero.subtitle}
            </p>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
              <Link
                href={hero.primaryCta.href}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold sm:px-6",
                  "bg-warm-gold text-on-surface",
                  "transition-colors hover:bg-warm-gold/90 active:scale-[0.98]",
                )}
              >
                {hero.primaryCta.label}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                href={hero.secondaryCta.href}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white sm:px-6",
                  "transition-colors hover:bg-white/10",
                )}
              >
                {hero.secondaryCta.label}
              </Link>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-2 p-4 sm:gap-3 sm:p-6 lg:col-span-5 lg:p-7">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/15 sm:rounded-2xl">
              <Image
                src={hero.imageSrc}
                alt={hero.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 45vw, 22vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/15 sm:rounded-2xl">
              <Image
                src={hero.secondaryImageSrc}
                alt={hero.secondaryImageAlt}
                fill
                sizes="(max-width: 1024px) 45vw, 22vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
