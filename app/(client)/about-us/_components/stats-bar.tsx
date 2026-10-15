import type { AboutStat } from "@/lib/mart-api/about-stats";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function StatsBar({ stats }: { stats: AboutStat[] }) {
  const visible = stats.filter(
    (stat) => stat.isActive && (stat.value.trim() || stat.label.trim()),
  );
  if (visible.length === 0) return null;
  return (
    <section className="w-full bg-[#f5f6f8] pb-12 sm:pb-16 lg:pb-20" aria-label="এক নজরে">
      <Container className="px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-neutral-200 ring-1 ring-neutral-200 lg:grid-cols-4">
          {visible.map((stat) => (
            <div key={stat.id} className="flex flex-col items-start gap-1 bg-white px-5 py-5 sm:px-6">
              <MaterialIcon name={stat.icon} className="mb-1 text-[22px] text-primary-ink" />
              <dt className="order-last text-sm leading-snug text-neutral-600">{stat.label}</dt>
              <dd className="text-2xl font-bold tabular-nums text-neutral-950 sm:text-[1.75rem]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
