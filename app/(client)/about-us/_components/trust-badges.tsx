import type { AboutValues } from "@/lib/mart-api/about-values";
import { valueIcon } from "@/lib/mart-api/about-values";

import { MaterialIcon } from "../../_components/common/material-icon";
import { AboutSection, SectionHeader, iconBadge } from "./about-ui";

export function TrustBadges({ values }: { values: AboutValues }) {
  const items = values.items.filter(
    (item) => item.isActive && item.title.trim() && item.description.trim(),
  );
  if (!items.length) return null;

  return (
    <AboutSection tone="white" labelledBy="about-values-heading">
      <SectionHeader
        id="about-values-heading"
        kicker={values.kicker}
        title={values.title}
        subtitle={values.subtitle}
      />
      <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 lg:flex-col">
            <span className={iconBadge}>
              <MaterialIcon name={valueIcon(item.icon)} className="text-[22px]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg leading-snug font-semibold text-neutral-950">{item.title}</h3>
              <p className="mt-1.5 text-[15px] leading-[1.7] text-neutral-600">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </AboutSection>
  );
}
