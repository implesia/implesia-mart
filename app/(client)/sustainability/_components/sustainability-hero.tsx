"use client";

import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityHero({ className }: { className?: string }) {
  const { hero } = sustainabilityCopy;

  return (
    <section className={cn("relative flex h-[680px] items-center overflow-hidden lg:h-[870px]", className)}>
      <div className="absolute inset-0">
        <Image src={hero.imageSrc} alt={hero.imageAlt} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 text-white md:px-12">
        <div className="max-w-2xl">
          <h1 className="font-display-xl">{hero.title}</h1>
          <p className="mt-6 font-body-lg text-stone-100">{hero.subtitle}</p>

          <Link
            href="/products"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "mt-10 h-12 gap-2 rounded-lg border-t border-white/10 bg-primary px-8 text-on-primary shadow-sm hover:bg-primary/90"
            )}
          >
            {hero.cta}
            <MaterialIcon name="arrow_forward" className="text-[20px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

