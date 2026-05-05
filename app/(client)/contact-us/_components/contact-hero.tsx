"use client";

import { cn } from "@/lib/utils";

import { contactCopy } from "../../_data/contact/contact";

export function ContactHero({ className }: { className?: string }) {
  return (
    <section className={cn("bg-surface-container-lowest py-xl", className)}>
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <h1 className="font-display-xl text-primary">{contactCopy.hero.title}</h1>
        <p className="mx-auto mt-sm max-w-2xl font-body-lg text-outline">
          {contactCopy.hero.subtitle}
        </p>
      </div>
    </section>
  );
}

