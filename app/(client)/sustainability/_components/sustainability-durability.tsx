import Image from "next/image";

import type { SustainabilityDurability } from "@/lib/mart-api/sustainability-durability";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { AboutSection, sectionImage } from "../../about-us/_components/about-ui";

/** Dark brand band for contrast mid-page; photo panel on the right, or two-column bullets. */
export function SustainabilityDurability({ durability }: { durability: SustainabilityDurability }) {
  const bullets = durability.bullets.filter((bullet) => bullet.isActive && bullet.text.trim());
  const image = sectionImage(durability.image);
  if (!durability.title.trim() && !durability.body.trim() && !bullets.length && !image) return null;

  return (
    <AboutSection labelledBy="sustain-durability-heading">
      <div
        className={cn(
          "relative isolate grid overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#062a27_0%,#0b1a1f_55%,#05080c_100%)]",
          image && "lg:grid-cols-2",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(36rem_20rem_at_15%_0%,rgba(43,192,181,0.28),transparent_60%)]"
        />
        <div className={cn("px-6 py-10 sm:px-10 sm:py-12 lg:py-16", !image && "lg:px-14")}>
          <h2
            id="sustain-durability-heading"
            className="text-2xl leading-[1.35] font-bold tracking-tight text-white sm:text-[1.75rem] lg:text-3xl"
          >
            {durability.title}
          </h2>
          {durability.body.trim() ? (
            <p className="mt-4 max-w-[40rem] text-base leading-[1.8] text-white/80">{durability.body}</p>
          ) : null}
          {bullets.length ? (
            <ul className={cn("mt-8 grid gap-3", !image && "sm:grid-cols-2")}>
              {bullets.map((bullet) => (
                <li
                  key={bullet.id}
                  className="flex items-start gap-3 rounded-xl bg-white/[0.06] px-4 py-3 text-[15px] leading-[1.6] text-white/90 ring-1 ring-white/10"
                >
                  <MaterialIcon name="check_circle" className="mt-0.5 shrink-0 text-[20px] text-[#8ed4c1]" />
                  <span>{bullet.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {image ? (
          <div className="p-3 pt-0 lg:p-4 lg:pl-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10 lg:aspect-auto lg:h-full lg:min-h-[22rem]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </AboutSection>
  );
}
