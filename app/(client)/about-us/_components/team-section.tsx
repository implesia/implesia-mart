"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function TeamSection({ className }: { className?: string }) {
  const { team } = aboutCopy;

  return (
    <section className={cn("bg-surface py-xl", className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-headline-md text-primary">{team.title}</h2>
            <p className="mt-4 font-body-md text-on-surface-variant">{team.subtitle}</p>
          </div>

          <Link
            href="#"
            className="inline-flex items-center gap-2 font-label-md text-primary transition-all hover:gap-4"
          >
            {team.linkLabel} <MaterialIcon name="arrow_forward" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
          {team.members.map((m) => (
            <div key={m.name} className="group cursor-pointer">
              <div className="relative mb-6 aspect-4/5 overflow-hidden rounded-xl">
                <Image
                  src={m.imageSrc}
                  alt={m.imageAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <h4 className="font-headline-sm text-primary">{m.name}</h4>
              <p className="mb-3 font-label-sm text-outline">{m.role}</p>
              <p className="text-sm leading-relaxed text-on-surface-variant">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

