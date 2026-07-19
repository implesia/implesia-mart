import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function StatsBar({ className }: { className?: string }) {
  return (
    <section className={cn("w-full pb-10 sm:pb-14 lg:pb-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {aboutCopy.stats.map((stat) => (
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
