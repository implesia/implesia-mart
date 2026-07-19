import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityImpact({ className }: { className?: string }) {
  const { impact } = sustainabilityCopy;

  return (
    <section className={cn("w-full py-10 sm:py-14 lg:py-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10 lg:mb-12">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary dark:border-primary/25 dark:bg-primary/12">
            <MaterialIcon name="insights" className="text-[16px]" />
            {impact.kicker}
          </span>
          <h2 className="mb-3 text-2xl leading-tight font-semibold text-primary sm:text-3xl lg:text-4xl">
            {impact.title}
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base">
            {impact.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {impact.stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl p-4 text-center sm:p-6",
                "bg-surface-container-lowest dark:bg-surface-container",
                "border border-outline-variant/35 dark:border-white/10",
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-12 dark:bg-primary/15">
                <MaterialIcon name={stat.icon} className="text-[20px] sm:text-[24px]" />
              </span>
              <span className="text-lg font-bold tabular-nums text-primary sm:text-2xl">
                {stat.value}
              </span>
              <span className="text-xs leading-snug text-on-surface-variant sm:text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
