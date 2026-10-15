import { impactIcon, type SustainabilityImpact } from "@/lib/mart-api/sustainability-impact";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { SectionHeader } from "../../about-us/_components/about-ui";

/** Key numbers in one connected card strip, like the About stats bar. */
export function SustainabilityImpact({ impact }: { impact: SustainabilityImpact }) {
  const items = impact.items.filter(
    (stat) => stat.isActive && (stat.value.trim() || stat.label.trim()),
  );
  if (!items.length) return null;
  const hasHeader = Boolean(impact.title.trim());

  return (
    <section
      className="w-full bg-[#f5f6f8] pt-8 pb-12 sm:pt-4 sm:pb-16 lg:pt-0 lg:pb-20"
      aria-labelledby={hasHeader ? "sustain-impact-heading" : undefined}
      aria-label={hasHeader ? undefined : "এক নজরে"}
    >
      <Container className="px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="sustain-impact-heading"
          kicker={impact.kicker}
          title={impact.title}
          subtitle={impact.subtitle}
          align="center"
          className="mb-8"
        />
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-neutral-200 ring-1 ring-neutral-200 lg:grid-cols-4">
          {items.map((stat) => (
            <div key={stat.id} className="flex flex-col items-start gap-1 bg-white px-5 py-5 sm:px-6 sm:py-6">
              <MaterialIcon name={impactIcon(stat.icon)} className="mb-1 text-[22px] text-primary-ink" />
              <dt className="order-last text-sm leading-snug text-neutral-600">{stat.label}</dt>
              <dd className="text-2xl font-bold tabular-nums text-neutral-950 sm:text-[1.75rem]">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
