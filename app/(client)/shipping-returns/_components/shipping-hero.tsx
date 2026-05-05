"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { shippingReturnsCopy } from "../../_data/shipping/shipping-returns";

export function ShippingHero({ className }: { className?: string }) {
  const { hero } = shippingReturnsCopy;

  return (
    <section className={cn("relative flex h-[360px] items-center justify-center overflow-hidden bg-surface-container-highest lg:h-[400px]", className)}>
      <div className="absolute inset-0 opacity-40">
        <Image src={hero.imageSrc} alt={hero.imageAlt} fill className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-[#001a16]/70" />

      <div className="relative z-10 px-6 text-center">
        <h1 className="mb-4 font-display-xl text-white">{hero.title}</h1>
        <p className="mx-auto max-w-2xl font-body-lg text-primary-fixed/90">
          {hero.subtitle}
        </p>
      </div>
    </section>
  );
}

