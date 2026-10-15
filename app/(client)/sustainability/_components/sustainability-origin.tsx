import type { SustainabilityOrigin } from "@/lib/mart-api/sustainability-origin";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { AboutSection, FramedPhoto, Kicker, sectionImage } from "../../about-us/_components/about-ui";

/** Point of view: framed photo + text with a pull quote; text-only when no photo. */
export function SustainabilityOrigin({ origin }: { origin: SustainabilityOrigin }) {
  const image = sectionImage(origin.image);
  if (!origin.title.trim() && !origin.body.trim() && !image) return null;

  return (
    <AboutSection tone="white" labelledBy="sustain-origin-heading">
      <div
        className={cn(
          "grid items-center gap-12 lg:gap-16",
          image && "md:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]",
        )}
      >
        {image ? (
          <FramedPhoto
            src={image.src}
            alt={image.alt}
            tilt="left"
            aspect="aspect-[4/3] lg:aspect-[5/4]"
            sizes="(max-width: 768px) 92vw, 40vw"
            className="order-2 md:order-1 md:max-w-[34rem]"
          />
        ) : null}
        <div className={cn("order-1 md:order-2", image ? "max-w-[38rem]" : "mx-auto max-w-[44rem] text-center")}>
          {origin.eyebrow.trim() ? <Kicker>{origin.eyebrow}</Kicker> : null}
          <h2
            id="sustain-origin-heading"
            className="text-2xl leading-[1.35] font-bold tracking-tight text-neutral-950 sm:text-[1.75rem] lg:text-3xl"
          >
            {origin.title}
          </h2>
          {origin.body.trim() ? (
            <p className="mt-4 text-base leading-[1.8] text-neutral-700">{origin.body}</p>
          ) : null}
          {origin.quote.trim() ? (
            <figure
              className={cn(
                "mt-8 rounded-2xl bg-[#f0faf8] px-6 py-5 ring-1 ring-primary/15",
                image ? "border-l-4 border-primary" : "mx-auto max-w-[34rem]",
              )}
            >
              <MaterialIcon name="format_quote" className="text-[28px] text-primary-ink" />
              <blockquote className="mt-1 text-lg leading-[1.6] font-semibold text-neutral-900">
                {origin.quote}
              </blockquote>
            </figure>
          ) : null}
        </div>
      </div>
    </AboutSection>
  );
}
