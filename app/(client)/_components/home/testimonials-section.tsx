"use client";

import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { testimonials } from "../../_data/home/home";

export function TestimonialsSection() {
  const marqueeItems = [...testimonials, ...testimonials];

  return (
    <section className="overflow-hidden bg-surface-container-high py-xl">
      <Container className="px-0 md:px-8">
        <div className="mb-16 px-6 text-center">
          <h2 className="mb-4 font-display-lg text-primary">
            আমাদের কাস্টমাররা যা বলছেন
          </h2>

          <p className="mx-auto max-w-2xl font-body-lg text-on-surface-variant">
            হাজারো সন্তুষ্ট কাস্টমারের বিশ্বাস নিয়ে আমরা এগিয়ে যাচ্ছি।
          </p>
        </div>

        {/* Marquee */}
        <div className="relative overflow-hidden">
          {/* Left Gradient */}
          <div className="pointer-events-none absolute top-0 left-0 z-20 h-full w-24 bg-linear-to-r from-surface-container-high to-transparent" />

          {/* Right Gradient */}
          <div className="pointer-events-none absolute top-0 right-0 z-20 h-full w-24 bg-linear-to-l from-surface-container-high to-transparent" />

          {/* Track */}
          <div className="marquee-track flex w-max gap-8">
            {marqueeItems.map((t, index) => (
              <Card
                key={`${t.id}-${index}`}
                className="glass-card w-[360px] shrink-0 rounded-3xl border border-white/10 bg-white/70 py-0 backdrop-blur-xl dark:bg-white/5"
              >
                <CardContent className="p-10">
                  {/* Stars */}
                  <div className="mb-6 flex gap-1 text-warm-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <MaterialIcon
                        key={`${t.id}-${i}`}
                        name="star"
                        filled
                        className="text-sm"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="mb-8 min-h-[110px] font-body-md leading-relaxed text-on-surface italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* User */}
                  <div className="flex items-center gap-4">
                    <div className="size-14 overflow-hidden rounded-full ring-2 ring-white/20">
                      <Image
                        src={t.avatarSrc}
                        alt={t.name}
                        width={56}
                        height={56}
                        className="size-full object-cover"
                      />
                    </div>

                    <div>
                      <h5 className="font-label-lg text-primary">
                        {t.name}
                      </h5>

                      <p className="text-sm text-outline">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}