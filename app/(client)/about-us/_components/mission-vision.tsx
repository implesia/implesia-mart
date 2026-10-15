import type { AboutMissionCard } from "@/lib/mart-api/about-mission";
import { missionIcon } from "@/lib/mart-api/about-mission";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function MissionVision({
  cards,
  className,
}: {
  cards: AboutMissionCard[];
  className?: string;
}) {
  const visible = cards.filter((card) => card.isActive && card.title.trim() && card.description.trim());
  if (!visible.length) return null;

  return (
    <section
      className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}
      aria-labelledby="about-mission-heading"
    >
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        {/* Cards are h3; without a section h2 they read as sub-points of the dresses section. */}
        <h2 id="about-mission-heading" className="sr-only">
          আমাদের ভিশন ও মিশন
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {visible.map((card, index) => (
            <div
              key={card.id}
              className={cn(
                "rounded-2xl border p-5 sm:p-6",
                index === 0
                  ? "border-neutral-200/90 bg-white"
                  : "border-transparent bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)] text-white",
              )}
            >
              <span
                className={cn(
                  "mb-3 flex size-10 items-center justify-center rounded-xl",
                  index === 0 ? "bg-primary/10 text-primary-ink" : "bg-white/10 text-[#8ed4c1]",
                )}
              >
                <MaterialIcon name={missionIcon(card.icon)} filled className="text-[22px]" />
              </span>
              <h3
                className={cn(
                  "mb-2 text-base font-semibold tracking-tight sm:text-lg",
                  index === 0 ? "text-neutral-950" : "text-white",
                )}
              >
                {card.title}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  index === 0 ? "text-neutral-600" : "text-white/70",
                )}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
