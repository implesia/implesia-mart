"use client";

import { cn } from "@/lib/utils";

import { privacyPolicyCopy } from "../../_data/privacy/privacy-policy";

export function PrivacyHero({ className }: { className?: string }) {
  const { hero } = privacyPolicyCopy;

  return (
    <section className={cn("pt-40 pb-20 bg-linear-to-b from-primary/10 to-transparent", className)}>
      <div className="mx-auto max-w-[1440px] px-6 text-center md:px-8">
        <h1 className="mb-base font-display-xl text-primary">{hero.title}</h1>
        <p className="mx-auto max-w-2xl font-body-lg text-outline">{hero.subtitle}</p>
      </div>
    </section>
  );
}

