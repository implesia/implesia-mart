"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityFashion({ className }: { className?: string }) {
  const { fashion } = sustainabilityCopy;

  return (
    <section className={cn("bg-primary py-xl text-on-primary overflow-hidden", className)}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-16 px-6 md:grid-cols-2 md:px-12">
        <div className="space-y-8">
          <h2 className="font-display-lg">{fashion.title}</h2>
          <p className="font-body-lg text-on-primary/80">{fashion.body}</p>

          <ul className="space-y-4">
            {fashion.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <MaterialIcon name="done_all" className="text-on-primary-container" filled />
                <span className="font-label-md">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <Image
            src={fashion.imageSrc}
            alt={fashion.imageAlt}
            width={1200}
            height={900}
            className="scale-105 rounded-xl shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

