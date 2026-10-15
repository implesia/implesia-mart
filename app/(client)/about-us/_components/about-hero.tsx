import Image from "next/image";
import type { ReactNode } from "react";

import type { AboutHero as AboutHeroContent } from "@/lib/mart-api/about-hero";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { CtaLink, sectionImage } from "./about-ui";

/** Store promises — same copy as the home "store promises" strip and footer (not CMS). */
const TRUST = [
  { icon: "payments", label: "ক্যাশ অন ডেলিভারি" },
  { icon: "verified", label: "কোয়ালিটি চেকড প্রোডাক্ট" },
  { icon: "local_shipping", label: "সারাদেশে ডেলিভারি" },
];

/** Highlights the last two words of a CMS title (only when it has 4+ words). */
function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 4) return { lead: title.trim(), tail: "" };
  return { lead: words.slice(0, -2).join(" "), tail: words.slice(-2).join(" ") };
}

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
  const { lead, tail } = splitTitle(hero.title);

  return (
    <section
      aria-labelledby="about-hero-title"
      className="relative isolate w-full overflow-hidden bg-[#f5f6f8]"
    >
      {/* Brand glow + faint dot grid; decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_85%_10%,rgba(20,184,166,0.16),transparent_60%),radial-gradient(40rem_24rem_at_0%_100%,rgba(20,184,166,0.10),transparent_60%),linear-gradient(180deg,#ffffff_0%,#f5f6f8_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(180deg,black,transparent_70%)]"
      />

      <Container className="px-4 pt-3 pb-12 sm:px-6 sm:pt-4 sm:pb-14 lg:px-8 lg:pb-20">
        {breadcrumb}
        <div className="mt-5 grid items-center gap-10 sm:mt-6 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:mt-8 lg:gap-14">
          <div className="max-w-[38rem]">
            {hero.eyebrow.trim() ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-[13px] font-semibold text-primary-ink shadow-sm ring-1 ring-primary/25">
                <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                {hero.eyebrow}
              </p>
            ) : null}
            <h1
              id="about-hero-title"
              className="mt-4 text-[2rem] leading-[1.25] font-bold tracking-tight text-neutral-950 sm:text-[2.5rem] lg:text-[3.25rem] lg:leading-[1.15]"
            >
              {lead}
              {tail ? (
                <>
                  {" "}
                  <span className="text-primary-ink">{tail}</span>
                </>
              ) : null}
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
            <div className="relative mx-auto w-full max-w-[30rem] md:max-w-none">
              <div
                aria-hidden
                className="absolute -inset-3 -z-10 rotate-3 rounded-[2rem] bg-gradient-to-br from-primary/25 via-primary/10 to-transparent sm:-inset-4"
              />
              <div className="rounded-[1.75rem] bg-white p-2 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] ring-1 ring-neutral-200/80">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-neutral-100 lg:aspect-[5/4]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority
                    sizes="(max-width: 768px) 92vw, 42vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)] ring-1 ring-neutral-200/80 sm:left-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary-ink">
                  <MaterialIcon name="payments" className="text-[22px]" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-neutral-950">১০০% ক্যাশ অন ডেলিভারি</span>
                  <span className="block text-xs text-neutral-600">পণ্য হাতে পেয়ে টাকা দিন</span>
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
