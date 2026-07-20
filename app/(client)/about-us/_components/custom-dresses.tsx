import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function CustomDresses({ className }: { className?: string }) {
  const { customDresses } = aboutCopy;

  return (
    <section className={cn("w-full py-10 sm:py-14 lg:py-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:order-1 lg:col-span-7">
            {customDresses.gallery.map((image) => (
              <div
                key={image.src}
                className="group relative aspect-4/5 overflow-hidden rounded-2xl ring-1 ring-outline-variant/30 dark:ring-white/10"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1024px) 33vw, 22vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          <div className="lg:order-2 lg:col-span-5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase sm:text-sm">
              <span aria-hidden className="h-px w-6 bg-warm-gold" />
              {customDresses.kicker}
            </span>

            <h2 className="mt-4 text-2xl leading-tight font-semibold text-primary sm:text-3xl lg:text-[2.15rem]">
              {customDresses.title}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {customDresses.subtitle}
            </p>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              {customDresses.features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/15">
                    <MaterialIcon name={feature.icon} className="text-[18px]" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface">{feature.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant sm:text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={customDresses.primaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 sm:px-8",
                  "bg-warm-gold text-sm font-semibold text-on-surface",
                  "transition-colors hover:bg-warm-gold/90 active:scale-[0.98]",
                )}
              >
                {customDresses.primaryCta.label}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </a>
              <Link
                href={customDresses.secondaryCta.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 sm:px-8",
                  "border border-outline-variant/40 text-sm font-semibold text-on-surface dark:border-white/15",
                  "transition-colors hover:border-primary/40 hover:text-primary",
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
