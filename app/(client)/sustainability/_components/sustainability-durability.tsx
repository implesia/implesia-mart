import Image from "next/image";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

export function SustainabilityDurability({ className }: { className?: string }) {
  const { durability } = sustainabilityCopy;

  return (
    <section className={cn("w-full py-10 sm:py-14 lg:py-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl sm:rounded-3xl",
            "grid grid-cols-1 lg:grid-cols-2",
            "bg-[#062f2c] dark:bg-[#041f1d]",
            "ring-1 ring-black/10 dark:ring-primary/15",
            "shadow-[0_20px_50px_rgba(6,47,44,0.18)] dark:shadow-[0_24px_56px_rgba(0,0,0,0.45)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,rgba(245,179,1,0.16),transparent_50%),radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(43,192,181,0.3),transparent_50%)]"
          />

          <div className="relative z-10 order-2 flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:order-1 lg:px-10 lg:py-14">
            <h2 className="mb-4 text-2xl leading-tight font-semibold text-white sm:mb-5 sm:text-3xl lg:text-[2.15rem]">
              {durability.title}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-white/70 sm:mb-8 sm:text-base">
              {durability.body}
            </p>

            <ul className="space-y-3.5">
              {durability.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-warm-gold/20 text-warm-gold">
                    <MaterialIcon name="done" className="text-[15px]" filled />
                  </span>
                  <span className="text-sm text-white/85 sm:text-base">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative order-1 aspect-4/3 w-full lg:order-2 lg:aspect-auto">
            <Image
              src={durability.imageSrc}
              alt={durability.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-r from-[#062f2c]/40 via-transparent to-transparent lg:from-[#062f2c]/50 lg:to-transparent"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
