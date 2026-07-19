"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import { shippingReturnsCopy } from "../../_data/shipping/shipping-returns";

export function SupportCenter({ className }: { className?: string }) {
  const { support } = shippingReturnsCopy;

  return (
    <section id="support" className={cn("scroll-mt-32", className)}>
      <div className="relative overflow-hidden rounded-3xl bg-[#001a16] p-10 text-center text-white md:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-primary/70 blur-3xl" />
        </div>

        <div className="relative z-10">
          <h2 className="font-display-lg">{support.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-fixed/70">{support.subtitle}</p>

          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-4 backdrop-blur-md">
              <MaterialIcon name="call" />
              <span className="font-bold">{support.phone}</span>
            </div>
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-4 backdrop-blur-md">
              <MaterialIcon name="mail" />
              <span className="font-bold">{support.email}</span>
            </div>
          </div>

          <Link
            href="/contact-us"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "mt-12 h-12 rounded-full bg-white px-10 font-bold text-on-primary hover:scale-105 transition-transform shadow-xl"
            )}
          >
            {support.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

