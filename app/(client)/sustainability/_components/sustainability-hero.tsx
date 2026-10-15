import Image from "next/image";
import Link from "next/link";

import type { SustainabilityHero as Hero } from "@/lib/mart-api/sustainability-hero";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function SustainabilityHero({
  hero,
  className,
}: {
  hero: Hero;
  className?: string;
}) {

  const heroImages = hero.images.filter((image) => image?.src).slice(0, 2);

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
            {hero.eyebrow.trim() ? (
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-[#8ed4c1]">
                {hero.eyebrow}
              </p>
            ) : null}

            <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-white sm:mb-4 sm:text-3xl lg:text-[2.15rem]">
              {hero.title}
            </h1>

            <p className="mb-5 max-w-xl text-sm leading-relaxed text-white/70 sm:mb-6 sm:text-base">
              {hero.subtitle}
            </p>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              {hero.primaryLabel.trim() ? (
                <Link
                  href={hero.primaryHref || "/"}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
                >
                  {hero.primaryLabel}
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </Link>
              ) : null}
              {hero.secondaryLabel.trim() ? (
                <Link
                  href={hero.secondaryHref || "/"}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {hero.secondaryLabel}
                </Link>
              ) : null}
            </div>
          </div>

          {/* Only real images: empty CMS slots used to render blank dark tiles. */}
          {heroImages.length ? (
          <div className="relative grid grid-cols-2 gap-2 p-4 sm:gap-3 sm:p-6 lg:col-span-5 lg:p-7">
            {heroImages.map((image, index) => (
              <div
                key={image.id ?? index}
                className="relative aspect-4/5 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 lg:aspect-square"
              >
                {image.src ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    className="object-cover object-top"
                  />
                ) : null}
              </div>
            ))}
          </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
