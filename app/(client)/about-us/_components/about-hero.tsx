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
    <section className={cn("w-full pt-6 pb-5 sm:pt-8 sm:pb-6 lg:pt-10 lg:pb-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[1.75rem]",
            "grid grid-cols-1 lg:grid-cols-12",
            "bg-[#062f2c] dark:bg-[#041f1d]",
            "ring-1 ring-black/10 dark:ring-primary/15",
            "shadow-[0_20px_50px_rgba(6,47,44,0.18)] dark:shadow-[0_24px_56px_rgba(0,0,0,0.45)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_0%_0%,rgba(43,192,181,0.35),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(245,179,1,0.14),transparent_50%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
          />

          {/* Copy */}
          <div className="relative z-10 order-2 flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:order-1 lg:col-span-7 lg:px-10 lg:py-14 xl:px-12">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-sm sm:mb-5">
              <span className="size-1.5 shrink-0 rounded-full bg-warm-gold" />
              {hero.eyebrow}
            </span>

            <h1 className="mb-4 text-2xl leading-tight font-semibold text-white sm:mb-5 sm:text-3xl md:text-4xl lg:text-[2.75rem]">
              {hero.title}
            </h1>

            <p className="mb-8 max-w-xl text-sm leading-relaxed text-white/70 sm:mb-9 sm:text-base">
              {hero.subtitle}
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href={hero.primaryCta.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 sm:px-8",
                  "bg-warm-gold text-sm font-semibold text-on-surface",
                  "transition-colors hover:bg-warm-gold/90 active:scale-[0.98]",
                )}
              >
                {hero.primaryCta.label}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                href={hero.secondaryCta.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 sm:px-8",
                  "text-sm font-semibold text-white transition-colors hover:bg-white/10",
                )}
              >
                {hero.secondaryCta.label}
              </Link>
            </div>
          </div>

          {/* Product imagery */}
          <div className="relative order-1 grid grid-cols-2 gap-2.5 p-5 sm:gap-3 sm:p-8 lg:order-2 lg:col-span-5 lg:gap-4 lg:p-8">
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
            <div className="relative aspect-square translate-y-4 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/15 sm:translate-y-6 sm:rounded-2xl">
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
