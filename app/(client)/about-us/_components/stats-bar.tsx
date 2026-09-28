import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function StatsBar({ className }: { className?: string }) {
  return (
    <section className={cn("w-full pb-6 sm:pb-8", className)} aria-label="স্টোর প্রতিশ্রুতি">
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-2 min-[400px]:gap-2.5 sm:gap-3 lg:grid-cols-4">
          {aboutCopy.stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center sm:flex-row sm:justify-center sm:gap-2.5 sm:rounded-2xl sm:px-3 sm:py-4",
                "bg-white",
                "border border-neutral-200/90",
              )}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-9">
                <MaterialIcon name={stat.icon} className="text-[16px] sm:text-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold tabular-nums text-neutral-950 sm:text-base">
                  {stat.value}
                </p>
                <p className="text-[11px] leading-tight text-neutral-600 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
