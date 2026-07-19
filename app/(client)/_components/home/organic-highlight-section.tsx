"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { organicHighlight } from "../../_data/home/home";

export function OrganicHighlightSection() {
  return (
    <section id="why-us" className="py-10 sm:py-14 lg:py-xl">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid overflow-hidden rounded-2xl sm:rounded-3xl",
            "grid-cols-1 lg:grid-cols-2",
            "bg-surface-container-lowest dark:bg-surface-container",
            "ring-1 ring-outline-variant/40 dark:ring-primary/15",
            "shadow-sm dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]",
          )}
        >
          {/* Images — simple 2×2, no absolute overlays */}
          <div className="relative bg-[#062f2c] p-4 sm:p-6 lg:p-8 dark:bg-[#041f1d]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,rgba(43,192,181,0.3),transparent_55%)]"
            />
            <div className="relative grid grid-cols-2 gap-2.5 sm:gap-3">
              {organicHighlight.images.map((img) => (
                <div
                  key={img.alt}
                  className="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/15 sm:rounded-2xl"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="relative mt-4 flex justify-center sm:mt-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <MaterialIcon name="verified" className="text-[18px] text-primary" />
                <span className="text-xs font-semibold text-white sm:text-sm">
                  কোয়ালিটি ভেরিফাইড স্টোর
                </span>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="flex flex-col justify-center gap-6 px-5 py-8 sm:gap-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase sm:text-sm">
                <span aria-hidden className="h-px w-6 bg-warm-gold" />
                {organicHighlight.kicker}
              </span>
              <h2 className="font-display-lg text-2xl leading-tight text-primary sm:text-3xl lg:text-[2.25rem]">
                {organicHighlight.title}
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base">
                {organicHighlight.description}
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
              {organicHighlight.bullets.map((item) => (
                <li
                  key={item.label}
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-3 sm:p-3.5",
                    "bg-surface-container-low/80 dark:bg-background/40",
                    "ring-1 ring-outline-variant/30 dark:ring-white/8",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warm-gold/12 text-warm-gold sm:size-10">
                    <MaterialIcon name={item.icon} className="text-[20px] sm:text-[22px]" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold leading-snug text-on-surface">
                      {item.title ?? item.label}
                    </p>
                    {item.detail ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <div>
              <Link
                href={organicHighlight.ctaHref}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 sm:w-auto sm:px-8 sm:py-4",
                  "bg-primary font-label-md text-on-primary",
                  "transition-colors hover:bg-primary/90 active:scale-[0.98]",
                )}
              >
                {organicHighlight.cta}
                <MaterialIcon name="arrow_forward" className="text-[20px]" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
