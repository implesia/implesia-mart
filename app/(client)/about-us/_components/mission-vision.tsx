import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function MissionVision({ className }: { className?: string }) {
  const { missionVision } = aboutCopy;
  const cards = [missionVision.vision, missionVision.mission];

  return (
    <section
      className={cn(
        "w-full bg-surface-container-low py-10 sm:py-14 lg:py-xl dark:bg-surface-container",
        className,
      )}
    >
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
          {cards.map((card, index) => (
            <div
              key={card.title}
              className={cn(
                "rounded-2xl p-6 sm:rounded-3xl sm:p-8 lg:p-10",
                "border border-outline-variant/35 dark:border-white/10",
                index === 0
                  ? "bg-surface-container-lowest dark:bg-surface-container-high"
                  : "bg-primary text-on-primary",
              )}
            >
              <span
                className={cn(
                  "mb-5 flex size-12 items-center justify-center rounded-xl sm:size-14",
                  index === 0
                    ? "bg-warm-gold/12 text-warm-gold"
                    : "bg-white/15 text-on-primary",
                )}
              >
                <MaterialIcon name={card.icon} filled className="text-[26px] sm:text-[28px]" />
              </span>
              <h3
                className={cn(
                  "mb-3 text-lg font-semibold sm:text-xl",
                  index === 0 ? "text-primary" : "text-on-primary",
                )}
              >
                {card.title}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed sm:text-base",
                  index === 0 ? "text-on-surface-variant" : "text-on-primary/85",
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
