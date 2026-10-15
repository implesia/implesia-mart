"use client";

import Image from "next/image";

import { type SustainabilityDurability } from "@/lib/mart-api/sustainability-durability";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function SustainabilityDurability({
  durability,
  className,
}: {
  durability: SustainabilityDurability;
  className?: string;
}) {
  const bullets = durability.bullets.filter((bullet) => bullet.isActive);
  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative grid grid-cols-1 overflow-hidden rounded-2xl",
            durability.image.src && "lg:grid-cols-2",
            "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(43,192,181,0.18),transparent_50%)]"
          />

          <div className="relative z-10 flex flex-col justify-center px-4 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-10">
            <h2 className="text-xl leading-tight font-semibold tracking-tight text-white sm:text-2xl">
              {durability.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-[15px]">
              {durability.body}
            </p>

            <ul className="mt-5 space-y-2.5">
              {bullets.map((bullet) => (
                <li key={bullet.id} className="flex items-start gap-2.5 text-sm text-white/85">
                  <MaterialIcon
                    name="check_circle"
                    className="mt-0.5 shrink-0 text-[18px] text-[#8ed4c1]"
                  />
                  <span>{bullet.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {durability.image.src ? (
          <div className="relative aspect-4/5 sm:aspect-[4/3] lg:aspect-auto lg:min-h-0">
              <Image
                src={durability.image.src}
                alt={durability.image.alt}
                fill
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="object-cover object-top"
              />
          </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
