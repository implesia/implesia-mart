import type { ReactNode } from "react";

import { type ContactHero } from "@/lib/mart-api/contact-hero";

import { Container } from "../../_components/common/container";
import { CtaLink, EyebrowPill, HeroBackdrop, HighlightTitle } from "../../about-us/_components/about-ui";

/**
 * Same language as the About / Sustainability heroes (brand glow, eyebrow pill,
 * highlighted h1), centred because the contact hero has no photo. `status` is the
 * live open/closed badge; the quick-contact cards overlap the bottom edge.
 */
export function ContactHero({
  hero,
  breadcrumb,
  status,
  overlap = false,
}: {
  hero: ContactHero;
  breadcrumb?: ReactNode;
  status?: ReactNode;
  overlap?: boolean;
}) {
  if (!hero.isActive) {
    return breadcrumb ? (
      <Container className="px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">{breadcrumb}</Container>
    ) : null;
  }
  const primary = hero.primaryCta.label.trim();
  const secondary = hero.secondaryCta.label.trim();

  return (
    <section aria-labelledby="contact-hero-title" className="relative isolate w-full overflow-hidden bg-[#f5f6f8]">
      <HeroBackdrop />
      <Container className={overlap ? "px-4 pt-3 pb-24 sm:px-6 sm:pt-4 sm:pb-28 lg:px-8 lg:pb-32" : "px-4 pt-3 pb-12 sm:px-6 sm:pt-4 sm:pb-14 lg:px-8 lg:pb-20"}>
        {breadcrumb}
        <div className="mx-auto mt-6 max-w-[44rem] text-center lg:mt-10">
          {hero.eyebrow.trim() ? <EyebrowPill>{hero.eyebrow}</EyebrowPill> : null}
          <h1
            id="contact-hero-title"
            className="mt-4 text-[2rem] leading-[1.25] font-bold tracking-tight text-neutral-950 sm:text-[2.5rem] lg:text-[3.25rem] lg:leading-[1.15]"
          >
            <HighlightTitle title={hero.title} />
          </h1>
          {hero.subtitle.trim() ? (
            <p className="mx-auto mt-4 max-w-[38rem] text-base leading-[1.75] text-neutral-600 sm:text-lg">
              {hero.subtitle}
            </p>
          ) : null}
          {primary || secondary ? (
            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:justify-center">
              {primary ? (
                <CtaLink href={hero.primaryCta.href} label={primary} className="shadow-lg shadow-primary/25" />
              ) : null}
              {secondary ? (
                <CtaLink href={hero.secondaryCta.href} label={secondary} tone="outline" className="bg-white" />
              ) : null}
            </div>
          ) : null}
          {status ? <div className="mt-6 flex min-h-9 justify-center">{status}</div> : null}
        </div>
      </Container>
    </section>
  );
}
