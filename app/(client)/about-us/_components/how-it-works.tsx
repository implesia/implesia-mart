import type { AboutSteps } from "@/lib/mart-api/about-steps";

import { AboutSection, SectionHeader } from "./about-ui";

export function HowItWorks({ steps }: { steps: AboutSteps }) {
  const items = steps.items.filter(
    (item) => item.isActive && item.title.trim() && item.description.trim(),
  );
  if (!items.length) return null;

  return (
    <AboutSection labelledBy="about-steps-heading">
      <SectionHeader
        id="about-steps-heading"
        kicker={steps.kicker}
        title={steps.title}
        subtitle={steps.subtitle}
      />
      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-2xl bg-white p-6 ring-1 ring-neutral-200/80">
            {/* CMS step label (e.g. ০১) is shown; falls back to position. */}
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-full bg-neutral-950 text-base font-bold text-white tabular-nums"
            >
              {item.step.trim() || index + 1}
            </span>
            <h3 className="mt-5 text-lg leading-snug font-semibold text-neutral-950">
              <span className="sr-only">ধাপ {index + 1}: </span>
              {item.title}
            </h3>
            <p className="mt-1.5 text-[15px] leading-[1.7] text-neutral-600">{item.description}</p>
          </li>
        ))}
      </ol>
    </AboutSection>
  );
}
