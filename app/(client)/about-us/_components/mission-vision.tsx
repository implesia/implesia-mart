"use client";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function MissionVision({ className }: { className?: string }) {
  const { missionVision } = aboutCopy;

  return (
    <section className={cn("bg-[#0B1F3B] py-xl text-white", className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 transition-colors hover:bg-white/10 lg:p-12">
            <MaterialIcon
              name={missionVision.vision.icon}
              className="mb-6 text-4xl text-primary-fixed-dim"
              filled
            />
            <h3 className="mb-4 font-headline-sm">{missionVision.vision.title}</h3>
            <p className="font-body-md text-white/80">{missionVision.vision.description}</p>
          </div>

          <div className="rounded-xl border border-white/20 bg-primary-container p-10 shadow-2xl lg:p-12">
            <MaterialIcon
              name={missionVision.mission.icon}
              className="mb-6 text-4xl text-primary-fixed"
              filled
            />
            <h3 className="mb-4 font-headline-sm">{missionVision.mission.title}</h3>
            <p className="font-body-md text-on-primary-container">
              {missionVision.mission.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

