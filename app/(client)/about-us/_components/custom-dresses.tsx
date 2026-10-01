"use client";

import Image from "next/image";
import Link from "next/link";

import { isExternalHref, type AboutDressBlock, type AboutLink } from "@/lib/mart-mock/about-sections";
import { useAboutSections } from "@/lib/mart-mock/hooks";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function CustomDresses({ className }: { className?: string }) {
  const { dresses } = useAboutSections();
  const visible = dresses.filter(isContentActive);
  if (!visible.length) return null;

  return (
    <div className={className}>
      {visible.map((dress) => (
        <DressBlock key={dress.id} dress={dress} />
      ))}
    </div>
  );
}

function DressBlock({ dress }: { dress: AboutDressBlock }) {
  const images = dress.gallery.filter((image) => image.src);
  const features = dress.features.filter(
    (feature) => isContentActive(feature) && (feature.title.trim() || feature.description.trim()),
  );

  return (
    <section className="w-full bg-[#f5f6f8] py-6 sm:py-8">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className={cn("grid grid-cols-1 items-start gap-6 lg:gap-10", images.length > 0 && "lg:grid-cols-12")}>
          {images.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:col-span-7">
              {images.map((image) => (
                <div key={image.id} className="group relative aspect-4/5 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className={images.length ? "lg:col-span-5" : undefined}>
            {dress.kicker ? <p className="text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">{dress.kicker}</p> : null}
            {dress.title ? <h2 className="mt-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">{dress.title}</h2> : null}
            {dress.subtitle ? <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">{dress.subtitle}</p> : null}

            {features.length ? (
              <div className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-start gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MaterialIcon name={feature.icon} className="text-[16px]" />
                    </span>
                    <div className="min-w-0">
                      {feature.title ? <h3 className="text-sm font-semibold text-neutral-950">{feature.title}</h3> : null}
                      {feature.description ? <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{feature.description}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <DressButtons primary={dress.primaryCta} secondary={dress.secondaryCta} />
          </div>
        </div>
      </Container>
    </section>
  );
}

function DressButtons({ primary, secondary }: { primary: AboutLink; secondary: AboutLink }) {
  const first = primary.label.trim() && primary.href.trim() ? primary : null;
  const second = secondary.label.trim() && secondary.href.trim() ? secondary : null;
  if (!first && !second) return null;

  return (
    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
      {first ? <DressLink link={first} tone="primary" /> : null}
      {second ? <DressLink link={second} tone="secondary" /> : null}
    </div>
  );
}

function DressLink({ link, tone }: { link: AboutLink; tone: "primary" | "secondary" }) {
  const className =
    tone === "primary"
      ? "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80"
      : "inline-flex h-10 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-950 transition-colors hover:border-neutral-400";

  if (isExternalHref(link.href)) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
        {tone === "primary" ? <MaterialIcon name="arrow_forward" className="text-[18px]" /> : null}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
      {tone === "primary" ? <MaterialIcon name="arrow_forward" className="text-[18px]" /> : null}
    </Link>
  );
}
