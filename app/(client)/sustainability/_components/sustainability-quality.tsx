import { qualityIcon, type SustainabilityQuality } from "@/lib/mart-api/sustainability-quality";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { AboutSection, FramedPhoto, sectionImage } from "../../about-us/_components/about-ui";

/** Quality checks as a numbered timeline beside a framed photo; text-only grid when none. */
export function SustainabilityQuality({ quality }: { quality: SustainabilityQuality }) {
  const steps = quality.steps.filter((step) => step.isActive && step.text.trim());
  const badges = quality.badges.filter((badge) => badge.isActive && badge.label.trim());
  const image = sectionImage(quality.image);
  if (!quality.title.trim() && !quality.body.trim() && !steps.length && !image) return null;

  return (
    <AboutSection tone="white" labelledBy="sustain-quality-heading">
      <div
        className={cn(
          "grid items-center gap-12 lg:gap-16",
          image && "md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]",
        )}
      >
        <div className={cn(!image && "mx-auto max-w-[56rem]")}>
          <header className={cn(!image && "mx-auto max-w-[40rem] text-center")}>
            <h2
              id="sustain-quality-heading"
              className="text-2xl leading-[1.35] font-bold tracking-tight text-neutral-950 sm:text-[1.75rem] lg:text-3xl"
            >
              {quality.title}
            </h2>
            {quality.body.trim() ? (
              <p className="mt-4 text-base leading-[1.8] text-neutral-700">{quality.body}</p>
            ) : null}
          </header>
          {steps.length ? (
            <ol className={cn("mt-8", image ? "relative space-y-5" : "grid gap-4 sm:grid-cols-2")}>
              {image ? (
                <span aria-hidden className="absolute top-2 bottom-2 left-[17px] w-px bg-primary/25" />
              ) : null}
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  className={cn(
                    "relative flex items-start gap-4",
                    !image && "rounded-2xl bg-[#f5f6f8] p-5",
                  )}
                >
                  <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary ring-4 ring-white">
                    {(index + 1).toLocaleString("bn-BD")}
                  </span>
                  <p className="pt-1.5 text-base leading-[1.7] text-neutral-800">{step.text}</p>
                </li>
              ))}
            </ol>
          ) : null}
          {badges.length ? (
            <ul className={cn("mt-8 flex flex-wrap gap-2.5", !image && "justify-center")}>
              {badges.map((badge) => (
                <li
                  key={badge.id}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f0faf8] px-4 text-sm font-medium text-neutral-800 ring-1 ring-primary/20"
                >
                  <MaterialIcon name={qualityIcon(badge.icon)} className="text-[18px] text-primary-ink" />
                  {badge.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {image ? (
          <FramedPhoto
            src={image.src}
            alt={image.alt}
            aspect="aspect-[4/3] lg:aspect-[5/4]"
            sizes="(max-width: 768px) 92vw, 40vw"
            className="md:ml-auto md:max-w-[34rem]"
          />
        ) : null}
      </div>
    </AboutSection>
  );
}
