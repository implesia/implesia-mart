import Image from "next/image";

import type { AboutDress } from "@/lib/mart-api/about-dresses";
import { dressIcon } from "@/lib/mart-api/about-dresses";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { AboutSection, CtaLink, CtaRow, SectionHeader, firstImage } from "./about-ui";

export function CustomDresses({ dresses }: { dresses: AboutDress[] }) {
  const visible = dresses.filter((dress) => dress.isActive);
  if (!visible.length) return null;
  return (
    <>
      {visible.map((dress) => (
        <DressBlock key={dress.id} dress={dress} />
      ))}
    </>
  );
}

function DressBlock({ dress }: { dress: AboutDress }) {
  // Admin can keep a full gallery; the storefront shows only the first image.
  const image = firstImage(dress.gallery);
  const features = dress.features.filter((feature) => feature.title.trim());
  const first = dress.primaryCta.label.trim() && dress.primaryCta.href.trim() ? dress.primaryCta : null;
  const second =
    dress.secondaryCta.label.trim() && dress.secondaryCta.href.trim() ? dress.secondaryCta : null;
  const headingId = `about-dress-${dress.id}`;

  return (
    <AboutSection tone="white" labelledBy={dress.title ? headingId : undefined}>
      <div className={cn("grid items-center gap-8 lg:gap-16", image && "md:grid-cols-2")}>
        {image ? (
          <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-neutral-100 sm:aspect-4/3 md:aspect-4/5">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 92vw, 46vw"
              className="object-cover object-top"
            />
          </div>
        ) : null}
        <div>
          <SectionHeader id={headingId} kicker={dress.kicker} title={dress.title} subtitle={dress.subtitle} />
          {features.length ? (
            <ul className="mt-6 space-y-4">
              {features.map((feature) => (
                <li key={feature.id} className="flex gap-3">
                  <MaterialIcon
                    name={dressIcon(feature.icon)}
                    className="mt-0.5 text-[22px] text-primary-ink"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base leading-snug font-semibold text-neutral-950">
                      {feature.title}
                    </h3>
                    {feature.description.trim() ? (
                      <p className="mt-1 text-[15px] leading-[1.7] text-neutral-600">
                        {feature.description}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {first || second ? (
            <CtaRow>
              {first ? <CtaLink href={first.href} label={first.label} /> : null}
              {second ? <CtaLink href={second.href} label={second.label} tone="outline" /> : null}
            </CtaRow>
          ) : null}
        </div>
      </div>
    </AboutSection>
  );
}
