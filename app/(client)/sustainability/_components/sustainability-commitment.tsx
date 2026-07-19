import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityCommitment({ className }: { className?: string }) {
  const { commitment } = sustainabilityCopy;

  return (
    <section
      className={cn(
        "w-full bg-surface-container-low py-10 sm:py-14 lg:py-xl dark:bg-surface-container",
        className,
      )}
    >
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10 lg:mb-12">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-warm-gold/30 bg-warm-gold/10 px-3 py-1.5 text-xs font-semibold text-warm-gold">
            <MaterialIcon name="handshake" className="text-[16px]" />
            {commitment.kicker}
          </span>
          <h2 className="mb-3 text-2xl leading-tight font-semibold text-primary sm:text-3xl lg:text-4xl">
            {commitment.title}
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base">
            {commitment.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {commitment.items.map((item) => (
            <div
              key={item.title}
              className={cn(
                "rounded-2xl p-5 text-center sm:p-6",
                "bg-surface-container-lowest dark:bg-surface-container-high",
                "border border-outline-variant/35 dark:border-white/10",
                "transition-colors hover:border-primary/30 dark:hover:border-primary/25",
              )}
            >
              <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-14 dark:bg-primary/15">
                <MaterialIcon name={item.icon} filled className="text-[24px] sm:text-[26px]" />
              </span>
              <h3 className="mb-2 text-sm font-semibold text-on-surface sm:text-base">
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed text-on-surface-variant sm:text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
