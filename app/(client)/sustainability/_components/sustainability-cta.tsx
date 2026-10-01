"use client";

import Link from "next/link";

import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { useSustainabilitySections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function SustainabilityCta({ className }: { className?: string }) {
  const { cta } = useSustainabilitySections();

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
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
            <h2 className="mb-2 text-xl leading-tight font-semibold tracking-tight text-white sm:text-2xl">
              {cta.title}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-white/70">{cta.subtitle}</p>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              {cta.primaryCta.label.trim() &&
              isExternalHref(cta.primaryCta.href) ? (
                <a
                  href={cta.primaryCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
                >
                  {cta.primaryCta.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </a>
              ) : cta.primaryCta.label.trim() ? (
                <Link
                  href={cta.primaryCta.href || "/"}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
                >
                  {cta.primaryCta.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </Link>
              ) : null}
              {cta.secondaryCta.label.trim() &&
              isExternalHref(cta.secondaryCta.href) ? (
                <a
                  href={cta.secondaryCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {cta.secondaryCta.label}
                </a>
              ) : cta.secondaryCta.label.trim() ? (
                <Link
                  href={cta.secondaryCta.href || "/"}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {cta.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
