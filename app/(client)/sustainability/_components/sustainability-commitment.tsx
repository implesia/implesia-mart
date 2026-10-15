import {
  commitmentIcon,
  type SustainabilityCommitment,
} from "@/lib/mart-api/sustainability-commitment";

import { MaterialIcon } from "../../_components/common/material-icon";
import { AboutSection, SectionHeader, iconBadge } from "../../about-us/_components/about-ui";

/** Responsibility cards: icon badge, title, description; gentle lift on hover. */
export function SustainabilityCommitment({ commitment }: { commitment: SustainabilityCommitment }) {
  const items = commitment.items.filter(
    (item) => item.isActive && (item.title.trim() || item.description.trim()),
  );
  if (!items.length && !commitment.title.trim()) return null;

  return (
    <AboutSection labelledBy="sustain-commitment-heading">
      <SectionHeader
        id="sustain-commitment-heading"
        kicker={commitment.kicker}
        title={commitment.title}
        subtitle={commitment.subtitle}
        align="center"
      />
      {items.length ? (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-neutral-200/90 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className={iconBadge}>
                <MaterialIcon name={commitmentIcon(item.icon)} className="text-[22px]" />
              </span>
              <h3 className="mt-4 text-lg leading-snug font-semibold text-neutral-950">{item.title}</h3>
              <p className="mt-1.5 text-[15px] leading-[1.7] text-neutral-600">{item.description}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </AboutSection>
  );
}
