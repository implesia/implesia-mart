"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { contactCopy } from "../../_data/contact/contact";

export function ContactMap({ className }: { className?: string }) {
  const { map } = contactCopy;

  return (
    <section className={cn("mx-auto max-w-7xl px-6 pb-xl lg:px-8", className)}>
      <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border/70 shadow-sm lg:h-[500px]">
        <Image
          src={map.imageSrc}
          alt={map.imageAlt}
          fill
          className="object-cover grayscale brightness-95"
        />
        <div className="pointer-events-none absolute inset-0 bg-primary/5" />

        <div className="glass-card absolute bottom-lg left-lg max-w-xs rounded-lg p-md shadow-xl">
          <h3 className="font-headline-sm text-primary">{map.cardTitle}</h3>
          <p className="mt-xs text-label-sm text-outline">{map.cardBody}</p>
          <Link href="#" className="mt-sm inline-flex items-center font-label-md text-primary hover:underline">
            {map.cardCta}
            <MaterialIcon name="north_east" className="ml-xs text-[18px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

