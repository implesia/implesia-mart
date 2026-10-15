import Image from "next/image";

import type { AboutHero as AboutHeroContent } from "@/lib/mart-api/about-hero";

import { Container } from "../../_components/common/container";
import { CtaLink, CtaRow, Kicker, sectionImage } from "./about-ui";

export function AboutHero({ hero }: { hero: AboutHeroContent }) {
  const image = sectionImage(hero.image);
  const primary = hero.primaryLabel.trim();
  const secondary = hero.secondaryLabel.trim();

  return (
    <section className="w-full bg-[#f5f6f8] pt-2 pb-12 sm:pb-16 lg:pb-20">
      <Container className="px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-14">
          <div className="max-w-[36rem]">
            {hero.eyebrow.trim() ? <Kicker>{hero.eyebrow}</Kicker> : null}
            <h1 className="text-[1.75rem] leading-[1.3] font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-[2.75rem]">
              {hero.title}
            </h1>
            {hero.subtitle.trim() ? (
              <p className="mt-4 text-base leading-[1.7] text-neutral-600 sm:text-lg">
                {hero.subtitle}
              </p>
            ) : null}
            {primary || secondary ? (
              <CtaRow>
                {primary ? <CtaLink href={hero.primaryHref} label={primary} /> : null}
                {secondary ? (
                  <CtaLink href={hero.secondaryHref} label={secondary} tone="outline" />
                ) : null}
              </CtaRow>
            ) : null}
          </div>

          {image ? (
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-white ring-1 ring-neutral-200/80 md:aspect-4/5 lg:aspect-square">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                sizes="(max-width: 768px) 92vw, 46vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
