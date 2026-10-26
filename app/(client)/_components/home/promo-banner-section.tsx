import Image from "next/image";
import Link from "next/link";

import {
  bannerCanOptimize,
  isExternalHref,
  renderablePromo,
  type PromoPublic,
} from "@/lib/promo-view";
import { cn } from "@/lib/utils";

import { Container } from "../common/container";

/** Presentational banner: also used (with a local preview URL) by the admin editor. */
export function PromoBannerView({
  promo,
  image,
  alt,
  cta,
  position,
}: {
  promo: PromoPublic;
  image: string;
  alt: string;
  cta: { href: string; label: string } | null;
  position: string;
}) {
  const light = promo.tone === "light";
  const headingId = "home-promo-heading";
  const hasText = Boolean(promo.eyebrow || promo.heading || promo.body);

  return (
    <div
      className={cn(
        "relative isolate flex min-h-[168px] items-center overflow-hidden rounded-2xl sm:min-h-[184px] lg:min-h-[208px]",
        light ? "bg-neutral-100" : "bg-neutral-900",
      )}
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(min-width: 1280px) 1216px, calc(100vw - 32px)"
        quality={75}
        unoptimized={!bannerCanOptimize(image)}
        style={{ objectPosition: position }}
        className="-z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10",
          light
            ? "bg-linear-to-r from-white/95 via-white/80 via-65% to-white/25"
            : "bg-linear-to-r from-black/80 via-black/60 via-65% to-black/20",
        )}
      />
      <div
        className={cn(
          "flex w-full flex-col items-start gap-2 px-5 py-5 sm:max-w-[34rem] sm:px-8 lg:max-w-[40rem] lg:px-10",
          light ? "text-neutral-950" : "text-white",
        )}
      >
        {hasText ? (
          <div className="min-w-0">
            {promo.eyebrow ? (
              <p
                className={cn(
                  "text-xs font-semibold tracking-wide break-words uppercase",
                  light ? "text-neutral-700" : "text-white/85",
                )}
              >
                {promo.eyebrow}
              </p>
            ) : null}
            {promo.heading ? (
              <h2
                id={headingId}
                className="mt-1 text-xl leading-snug font-semibold tracking-tight break-words text-balance sm:text-2xl lg:text-[1.7rem]"
              >
                {promo.heading}
              </h2>
            ) : null}
            {promo.body ? (
              <p
                className={cn(
                  "mt-1.5 hidden line-clamp-2 text-sm leading-relaxed break-words min-[480px]:block",
                  light ? "text-neutral-800" : "text-white/90",
                )}
              >
                {promo.body}
              </p>
            ) : null}
          </div>
        ) : null}
        {cta ? <PromoCta cta={cta} light={light} /> : null}
      </div>
    </div>
  );
}

function PromoCta({
  cta,
  light,
}: {
  cta: { href: string; label: string };
  light: boolean;
}) {
  const className = cn(
    "mt-1 inline-flex min-h-11 max-w-full items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
    light
      ? "bg-neutral-950 text-white hover:bg-neutral-800 focus-visible:outline-neutral-950"
      : "bg-white text-neutral-950 hover:bg-neutral-100 focus-visible:outline-white",
  );
  if (isExternalHref(cta.href)) {
    return (
      <a href={cta.href} className={className} rel="noopener noreferrer">
        <span className="truncate">{cta.label}</span>
      </a>
    );
  }
  return (
    <Link href={cta.href} className={className}>
      <span className="truncate">{cta.label}</span>
    </Link>
  );
}

/** Slim promotional banner under Featured Products; renders nothing unless the store published one. */
export function PromoBannerSection({ promo }: { promo: PromoPublic | null }) {
  const view = renderablePromo(promo);
  if (!promo || !view) return null;
  return (
    <section
      className="bg-[#f5f6f8] pb-6 sm:pb-8 dark:bg-background"
      aria-label={promo.heading || view.alt}
      data-testid="home-promo"
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <PromoBannerView
          promo={promo}
          image={view.image}
          alt={view.alt}
          cta={view.cta}
          position={view.position}
        />
      </Container>
    </section>
  );
}
