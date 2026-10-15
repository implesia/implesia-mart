import type { ReactNode } from "react";

import type { SustainabilityHero as Hero } from "@/lib/mart-api/sustainability-hero";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import {
  CtaLink,
  EyebrowPill,
  FramedPhoto,
  HeroBackdrop,
  HighlightTitle,
  sectionImage,
} from "../../about-us/_components/about-ui";

/**
 * Same language as the About hero: brand glow, eyebrow pill, highlighted h1 and a
 * framed photo. With no CMS photo it switches to a centred text-only layout.
 */
export function SustainabilityHero({
  hero,
  breadcrumb,
}: {
  hero: Hero;
  breadcrumb?: ReactNode;
}) {
  const image = sectionImage(hero.image);
  const primary = hero.primaryLabel.trim();
  const secondary = hero.secondaryLabel.trim();
  const centered = !image;

  return (
    <section
      aria-labelledby="sustain-hero-title"
      className="relative isolate w-full overflow-hidden bg-[#f5f6f8]"
    >
      <HeroBackdrop />
      <Container className="px-4 pt-3 pb-12 sm:px-6 sm:pt-4 sm:pb-14 lg:px-8 lg:pb-20">
        {breadcrumb}
        <div
          className={cn(
            "mt-5 grid items-center gap-10 sm:mt-6 lg:mt-8 lg:gap-14",
            !centered && "md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]",
          )}
        >
          <div className={cn(centered ? "mx-auto max-w-[44rem] text-center" : "max-w-[38rem]")}>
            {hero.eyebrow.trim() ? <EyebrowPill>{hero.eyebrow}</EyebrowPill> : null}
            <h1
              id="sustain-hero-title"
              className="mt-4 text-[2rem] leading-[1.25] font-bold tracking-tight text-neutral-950 sm:text-[2.5rem] lg:text-[3.25rem] lg:leading-[1.15]"
            >
              <HighlightTitle title={hero.title} />
            </h1>
            {hero.subtitle.trim() ? (
              <p
                className={cn(
                  "mt-4 text-base leading-[1.75] text-neutral-600 sm:text-lg",
                  centered ? "mx-auto max-w-[38rem]" : "max-w-[34rem]",
                )}
              >
                {hero.subtitle}
              </p>
            ) : null}
            {primary || secondary ? (
              <div
                className={cn(
                  "mt-7 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap",
                  centered && "min-[420px]:justify-center",
                )}
              >
                {primary ? (
                  <CtaLink href={hero.primaryHref} label={primary} className="shadow-lg shadow-primary/25" />
                ) : null}
                {secondary ? (
                  <CtaLink href={hero.secondaryHref} label={secondary} tone="outline" className="bg-white" />
                ) : null}
              </div>
            ) : null}
          </div>

          {image ? (
            <FramedPhoto src={image.src} alt={image.alt} priority sizes="(max-width: 768px) 92vw, 42vw">
              <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)] ring-1 ring-neutral-200/80 sm:left-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary-ink">
                  <MaterialIcon name="eco" className="text-[22px]" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-neutral-950">কম রিটার্ন, কম বর্জ্য</span>
                  <span className="block text-xs text-neutral-600">যাচাই করে পাঠানো প্রোডাক্ট</span>
                </span>
              </div>
            </FramedPhoto>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
