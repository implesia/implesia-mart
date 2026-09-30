"use client";

import Image from "next/image";
import Link from "next/link";

import { isExternalHref } from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function CustomDresses({ className }: { className?: string }) {
  const { customDresses } = useAboutSections();

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:col-span-7">
            {customDresses.gallery.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-4/5 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white"
              >
                {image.src ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="lg:col-span-5">
            <p className="text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
              {customDresses.kicker}
            </p>

            <h2 className="mt-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {customDresses.title}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
              {customDresses.subtitle}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              {customDresses.features.map((feature) => (
                <div key={feature.id} className="flex items-start gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MaterialIcon name={feature.icon} className="text-[16px]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-950">{feature.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              {isExternalHref(customDresses.primaryCta.href) ? (
                <a
                  href={customDresses.primaryCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold",
                    "bg-primary text-on-primary transition-colors hover:bg-primary/80",
                  )}
                >
                  {customDresses.primaryCta.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </a>
              ) : (
                <Link
                  href={customDresses.primaryCta.href || "/"}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold",
                    "bg-primary text-on-primary transition-colors hover:bg-primary/80",
                  )}
                >
                  {customDresses.primaryCta.label}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </Link>
              )}
              <Link
                href={customDresses.secondaryCta.href}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-950",
                  "transition-colors hover:border-neutral-400",
                )}
              >
                {customDresses.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
