import {
  impactIcon,
  type SustainabilityImpact,
} from "@/lib/mart-api/sustainability-impact";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function SustainabilityImpact({
  impact,
  className,
}: {
  impact: SustainabilityImpact;
  className?: string;
}) {
  return (
    <section
      className={cn("w-full bg-[#f5f6f8] pb-6 sm:pb-8", className)}
      aria-label={impact.title}
    >
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-4 max-w-2xl text-center">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
            {impact.kicker}
          </p>
          <h2 className="mb-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {impact.title}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {impact.subtitle}
          </p>
        </div>
        <ul className="grid grid-cols-2 divide-x divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white lg:grid-cols-4 lg:divide-y-0">
          {impact.items.map((stat) => (
            <li
              key={stat.id}
              className="flex flex-col items-center justify-center gap-1 px-3 py-3.5 text-center sm:flex-row sm:gap-2.5 sm:px-4 sm:py-4 sm:text-left"
            >
              <MaterialIcon
                name={impactIcon(stat.icon)}
                className="text-[18px] text-primary sm:text-[20px]"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold tabular-nums text-neutral-950 sm:text-[15px]">
                  {stat.value}
                </p>
                <p className="text-[11px] leading-tight text-neutral-600 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
