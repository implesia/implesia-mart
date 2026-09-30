"use client";

import { useAboutSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function StatsBar({ className }: { className?: string }) {
  const { stats } = useAboutSections();
  return (
    <section
      className={cn("w-full bg-[#f5f6f8] pb-6 sm:pb-8", className)}
      aria-label="স্টোর প্রতিশ্রুতি"
    >
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-2 divide-x divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white lg:grid-cols-4 lg:divide-y-0">
          {stats.map((stat) => (
            <li
              key={stat.id}
              className="flex flex-col items-center justify-center gap-1 px-3 py-3.5 text-center sm:flex-row sm:gap-2.5 sm:px-4 sm:py-4 sm:text-left"
            >
              <MaterialIcon
                name={stat.icon}
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
