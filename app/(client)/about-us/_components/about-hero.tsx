"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function AboutHero({ className }: { className?: string }) {
  const { hero } = useAboutSections();

  return (
    <section className={cn("w-full bg-[#f5f6f8] pb-5 sm:pb-6", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl",
            "grid grid-cols-1 lg:grid-cols-12",
            "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-[58%] bg-[radial-gradient(circle_at_60%_50%,rgba(43,192,181,0.22),transparent_62%)]"
          />

          <div className="relative z-10 flex flex-col justify-center px-4 py-6 sm:px-7 sm:py-8 lg:col-span-7 lg:px-8 lg:py-10">
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
              {hero.eyebrow}
            </p>

            <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-white sm:mb-4 sm:text-3xl lg:text-[2.15rem]">
              {hero.title}
            </h1>

            <p className="mb-5 max-w-xl text-sm leading-relaxed text-white/70 sm:mb-6 sm:text-base">
              {hero.subtitle}
            </p>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <AboutCta
                href={hero.primaryCta.href}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80 sm:h-10"
              >
                {hero.primaryCta.label}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </AboutCta>
              <AboutCta
                href={hero.secondaryCta.href}
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {hero.secondaryCta.label}
              </AboutCta>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-2 p-4 sm:gap-3 sm:p-6 lg:col-span-5 lg:p-7">
            {hero.images.slice(0, 2).map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
              >
                {image.src ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function AboutCta({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href || "/"} className={className}>
      {children}
    </Link>
  );
}
