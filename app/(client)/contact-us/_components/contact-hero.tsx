"use client";

import Link from "next/link";

import { type ContactHero } from "@/lib/mart-api/contact-hero";
import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function ContactHero({
  hero,
  className,
}: {
  hero: ContactHero;
  className?: string;
}) {
  if (!hero.isActive) return null;

  return (
    <section className={cn("w-full bg-[#f5f6f8] pb-5 sm:pb-6", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl px-4 py-8 text-center sm:px-8 sm:py-10",
            "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
          />

          <div className="relative z-10 mx-auto max-w-lg">
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
              {hero.eyebrow}
            </p>
            <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-white sm:mb-4 sm:text-3xl lg:text-[2.15rem]">
              {hero.title}
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-white/70 sm:text-base">
              {hero.subtitle}
            </p>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              {hero.primaryCta.label.trim() &&
              isExternalHref(hero.primaryCta.href) ? (
                <a
                  href={hero.primaryCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
                >
                  {hero.primaryCta.label}
                  <MaterialIcon name="chat" className="text-[18px]" />
                </a>
              ) : hero.primaryCta.label.trim() ? (
                <Link
                  href={hero.primaryCta.href || "/"}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
                >
                  {hero.primaryCta.label}
                  <MaterialIcon name="chat" className="text-[18px]" />
                </Link>
              ) : null}
              {hero.secondaryCta.label.trim() &&
              (isExternalHref(hero.secondaryCta.href) ||
                hero.secondaryCta.href.startsWith("tel:") ||
                hero.secondaryCta.href.startsWith("mailto:")) ? (
                <a
                  href={hero.secondaryCta.href}
                  {...(isExternalHref(hero.secondaryCta.href)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {hero.secondaryCta.label}
                </a>
              ) : hero.secondaryCta.label.trim() ? (
                <Link
                  href={hero.secondaryCta.href || "/"}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {hero.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
