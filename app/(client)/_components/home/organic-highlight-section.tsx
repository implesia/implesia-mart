"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { organicHighlight } from "../../_data/home/home";
import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";

export function OrganicHighlightSection() {
  return (
    <section id="why-us" className="py-12 sm:py-14 lg:py-20">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div
          className={cn(  
            "grid overflow-hidden rounded-[1.35rem] sm:rounded-[1.75rem]",
            "grid-cols-1 lg:grid-cols-2",
            "bg-surface-container-lowest dark:bg-surface-container",
            "ring-1 ring-black/[0.06] dark:ring-primary/15",
            "shadow-[0_20px_50px_-24px_rgba(6,47,44,0.2)]",
          )}
        >
          {/* Product mosaic */}
          <div className="relative order-1 bg-[#062f2c] p-4 sm:p-6 lg:order-1 lg:p-8 dark:bg-[#041f1d]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_20%_10%,rgba(43,192,181,0.32),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(245,179,1,0.12),transparent_50%)]"
            />

            <div className="relative grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {organicHighlight.images.map((img, index) => (
                <div
                  key={img.alt}
                  className={cn(
                    "relative overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 sm:rounded-2xl",
                    index % 2 === 1 ? "mt-3 sm:mt-5" : "mb-3 sm:mb-5",
                    "aspect-square",
                  )}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_25%,rgba(43,192,181,0.16),transparent_65%)]"
                  />
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    className="object-contain object-center p-3 sm:p-4"
                  />
                </div>
              ))}
            </div>

            <div className="relative mt-1 flex justify-center sm:mt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3.5 py-2 backdrop-blur-md">
                <MaterialIcon name="verified" filled className="text-[18px] text-primary-fixed" />
                <span className="text-xs font-semibold text-white sm:text-sm">
                  {organicHighlight.storeBadge}
                </span>
              </div>
            </div>
          </div>

          {/* Copy + benefits */}
          <div className="order-2 flex flex-col justify-center gap-6 px-5 py-8 sm:gap-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-12">
            <div>
              <p className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase sm:text-xs">
                <span className="h-px w-6 bg-warm-gold/90" aria-hidden />
                {organicHighlight.kicker}
              </p>
              <h2 className="mb-3 max-w-[18ch] text-2xl leading-snug font-semibold tracking-tight text-on-background sm:max-w-none sm:text-3xl lg:text-[2.15rem] lg:leading-[1.2]">
                {organicHighlight.title}
              </h2>
              <p className="max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
                {organicHighlight.description}
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {organicHighlight.bullets.map((item) => (
                <li
                  key={item.title}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl p-3.5 sm:p-4",
                    "bg-surface-container-low/90 dark:bg-background/35",
                    "ring-1 ring-outline-variant/30 dark:ring-white/8",
                    "transition-colors hover:ring-primary/25",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <MaterialIcon name={item.icon} className="text-[20px]" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold leading-snug text-on-surface">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant sm:text-[13px]">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div>
              <Link
                href={organicHighlight.ctaHref}
                className={cn(
                  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold sm:w-auto",
                  "bg-primary text-on-primary",
                  "transition-all hover:bg-primary/90 active:scale-[0.98]",
                  "dark:shadow-[0_10px_28px_rgba(61,212,200,0.2)]",
                )}
              >
                {organicHighlight.cta}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
