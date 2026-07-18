"use client";

import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityCta({ className }: { className?: string }) {
  const { cta } = sustainabilityCopy;

  return (
    <section className={cn("py-xl", className)}>
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary-container p-10 text-center md:p-16 lg:p-24">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <Image src={cta.backgroundSrc} alt={cta.backgroundAlt} fill className="object-cover" />
          </div>

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-display-lg text-on-primary-container">{cta.title}</h2>
            <p className="mt-6 font-body-lg text-on-primary-container/90">{cta.subtitle}</p>

            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/products"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 rounded-full px-10 bg-primary text-on-primary hover:scale-105 transition-transform"
                )}
              >
                {cta.primary}
              </Link>
              <Link
                href="/contact-us"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-full px-10 border-on-primary-container text-on-primary-container hover:bg-on-primary-container/10"
                )}
              >
                {cta.secondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

