import type { ReactNode } from "react";

import type { AboutHero as AboutHeroContent } from "@/lib/mart-api/about-hero";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import {
  CtaLink,
  EyebrowPill,
  FramedPhoto,
  HeroBackdrop,
  HighlightTitle,
  sectionImage,
} from "./about-ui";

/** Store promises — same copy as the home "store promises" strip and footer (not CMS). */
const TRUST = [
  { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
  { icon: "verified", label: "কোয়ালিটি চেকড প্রোডাক্ট" },
  { icon: "local_shipping", label: "সারাদেশে ডেলিভারি" },
];

export function AboutHero({
  hero,
  breadcrumb,
}: {
  hero: AboutHeroContent;
  breadcrumb?: ReactNode;
}) {
  const image = sectionImage(hero.image);
  const primary = hero.primaryLabel.trim();
  const secondary = hero.secondaryLabel.trim();

  return (
    <section
      aria-labelledby="about-hero-title"
      className="relative isolate w-full overflow-hidden bg-[#f5f6f8]"
    >
      <HeroBackdrop />

      <Container className="px-4 pt-3 pb-12 sm:px-6 sm:pt-4 sm:pb-14 lg:px-8 lg:pb-20">
        {breadcrumb}
        <div className="mt-5 grid items-center gap-10 sm:mt-6 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:mt-8 lg:gap-14">
          <div className="max-w-[38rem]">
            {hero.eyebrow.trim() ? (
              <EyebrowPill>{hero.eyebrow}</EyebrowPill>
            ) : null}
            <h1
              id="about-hero-title"
              className="mt-4 text-[2rem] leading-[1.25] font-bold tracking-tight text-neutral-950 sm:text-[2.5rem] lg:text-[3.25rem] lg:leading-[1.15]"
            >
              <HighlightTitle title={hero.title} />
            </h1>
            {hero.subtitle.trim() ? (
              <p className="mt-4 max-w-[34rem] text-base leading-[1.75] text-neutral-600 sm:text-lg">
                {hero.subtitle}
              </p>
            ) : null}
            {primary || secondary ? (
              <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                {primary ? (
                  <CtaLink
                    href={hero.primaryHref}
                    label={primary}
                    className="shadow-lg shadow-primary/25"
                  />
                ) : null}
                {secondary ? (
                  <CtaLink href={hero.secondaryHref} label={secondary} tone="outline" className="bg-white" />
                ) : null}
              </div>
            ) : null}
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 border-t border-neutral-200/80 pt-5 text-sm font-medium text-neutral-700">
              {TRUST.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5">
                  <MaterialIcon name={item.icon} className="text-[18px] text-primary-ink" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {image ? (
            <FramedPhoto
              src={image.src}
              alt={image.alt}
              priority
              sizes="(max-width: 768px) 92vw, 42vw"
            >
              <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)] ring-1 ring-neutral-200/80 sm:left-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary-ink">
                  <MaterialIcon name="payments" className="text-[22px]" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-neutral-950">১০০% ক্যাশ অন ডেলিভারি</span>
                  <span className="block text-xs text-neutral-600">পণ্য হাতে পেয়ে টাকা দিন</span>
                </span>
              </div>
            </FramedPhoto>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
