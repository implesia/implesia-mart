import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function MissionVision({ className }: { className?: string }) {
  const { missionVision } = aboutCopy;
  const cards = [missionVision.vision, missionVision.mission];

  return (
    <section className={cn("w-full bg-white py-6 sm:py-8 lg:py-10", className)}>
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {cards.map((card, index) => (
            <div
              key={card.title}
              className={cn(
                "rounded-2xl p-5 sm:p-6",
                "border",
                index === 0
                  ? "border-neutral-200/90 bg-[#f5f6f8]"
                  : "border-transparent bg-primary text-on-primary",
              )}
            >
              <span
                className={cn(
                  "mb-3 flex size-10 items-center justify-center rounded-xl sm:size-11",
                  index === 0
                    ? "bg-warm-gold/15 text-on-surface"
                    : "bg-white/15 text-on-primary",
                )}
              >
                <MaterialIcon name={card.icon} filled className="text-[22px]" />
              </span>
              <h3
                className={cn(
                  "mb-2 text-base font-semibold sm:text-lg",
                  index === 0 ? "text-neutral-950" : "text-on-primary",
                )}
              >
                {card.title}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  index === 0 ? "text-neutral-600" : "text-on-primary/85",
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
