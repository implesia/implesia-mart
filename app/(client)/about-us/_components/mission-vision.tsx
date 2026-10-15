import type { AboutMissionCard } from "@/lib/mart-api/about-mission";
import { missionIcon } from "@/lib/mart-api/about-mission";

import { MaterialIcon } from "../../_components/common/material-icon";
import { AboutSection, iconBadge } from "./about-ui";

export function MissionVision({ cards }: { cards: AboutMissionCard[] }) {
  const visible = cards.filter(
    (card) => card.isActive && card.title.trim() && card.description.trim(),
  );
  if (!visible.length) return null;

  return (
    <AboutSection labelledBy="about-mission-heading">
      <h2
        id="about-mission-heading"
        className="mb-8 text-2xl leading-[1.35] font-bold tracking-tight text-neutral-950 sm:text-[1.75rem] lg:text-3xl"
      >
        আমাদের ভিশন ও মিশন
      </h2>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {visible.map((card) => (
          <article key={card.id} className="rounded-2xl bg-white p-6 ring-1 ring-neutral-200/80 sm:p-8">
            <span className={iconBadge}>
              <MaterialIcon name={missionIcon(card.icon)} className="text-[22px]" />
            </span>
            <h3 className="mt-5 text-xl leading-snug font-semibold text-neutral-950">{card.title}</h3>
            <p className="mt-2 max-w-[60ch] text-base leading-[1.7] text-neutral-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </AboutSection>
  );
}
