"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { Container } from "../common/container";
import { MaterialIcon } from "../common/material-icon";
import { organicHighlight } from "../../_data/home/home";

export function OrganicHighlightSection() {
  const [hero, secondary, tertiary] = organicHighlight.images;

  return (
    <section id="why-us" className="relative py-10 sm:py-14 lg:py-xl">
      <Container className="px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={cn(
            "relative grid overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[1.75rem]",
            "grid-cols-1 lg:grid-cols-12",
            "bg-surface-container-lowest dark:bg-surface-container",
            "ring-1 ring-outline-variant/40 dark:ring-primary/15",
            "shadow-[0_20px_50px_rgba(15,40,38,0.08)] dark:shadow-[0_24px_56px_rgba(0,0,0,0.4)]",
          )}
        >
          {/* Visual stage */}
          <div className="relative order-1 min-h-[280px] overflow-hidden bg-[#062f2c] sm:min-h-[340px] lg:order-1 lg:col-span-5 lg:min-h-full dark:bg-[#041f1d]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_30%_20%,rgba(43,192,181,0.35),transparent_55%),radial-gradient(ellipse_60%_50%_at_80%_90%,rgba(245,179,1,0.14),transparent_50%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
            />

            {/* Hero product */}
            <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8 lg:p-10">
              <div className="relative aspect-square w-[72%] max-w-[280px] sm:w-[68%] sm:max-w-[320px] lg:w-full lg:max-w-[300px]">
                <div
                  aria-hidden
                  className="absolute -inset-4 rounded-full bg-primary/20 blur-3xl"
                />
                <div className="relative size-full overflow-hidden rounded-[1.5rem] ring-1 ring-white/15 shadow-[0_24px_48px_rgba(0,0,0,0.35)] sm:rounded-[1.75rem]">
                  <Image
                    src={hero.src}
                    alt={hero.alt}
                    fill
                    sizes="(max-width: 1024px) 60vw, 280px"
                    className="object-cover"
                    priority={false}
                  />
                </div>
              </div>
            </div>

            {/* Secondary thumbs */}
            {secondary ? (
              <div className="absolute bottom-5 left-4 hidden size-20 overflow-hidden rounded-2xl ring-2 ring-white/20 shadow-xl sm:bottom-6 sm:left-6 sm:block sm:size-24 lg:bottom-8 lg:left-8">
                <Image
                  src={secondary.src}
                  alt={secondary.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ) : null}
            {tertiary ? (
              <div className="absolute top-5 right-4 hidden size-16 overflow-hidden rounded-xl ring-2 ring-white/20 shadow-xl sm:top-6 sm:right-6 sm:block sm:size-20 lg:top-8 lg:right-8">
                <Image
                  src={tertiary.src}
                  alt={tertiary.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#041f1d]/90 to-transparent px-5 pb-5 pt-16 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                <MaterialIcon
                  name="verified"
                  className="text-[18px] text-primary"
                />
                <span className="text-xs font-semibold tracking-wide text-white sm:text-sm">
                  কোয়ালিটি ভেরিফাইড স্টোর
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative order-2 flex flex-col justify-center gap-7 px-5 py-8 sm:gap-8 sm:px-8 sm:py-10 lg:col-span-7 lg:px-10 lg:py-12 xl:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(43,192,181,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(61,212,200,0.08),transparent_50%)]"
            />

            <div className="relative space-y-3 sm:space-y-4">
              <span className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.2em] text-primary uppercase sm:text-[13px]">
                <span aria-hidden className="h-px w-7 bg-warm-gold" />
                {organicHighlight.kicker}
              </span>
              <h2 className="font-display-lg text-[1.65rem] leading-tight text-primary sm:text-[2rem] lg:text-[2.35rem]">
                {organicHighlight.title}
              </h2>
              <p className="max-w-prose text-sm leading-relaxed text-on-surface-variant sm:text-base">
                {organicHighlight.description}
              </p>
            </div>

            <ul className="relative grid gap-0 divide-y divide-outline-variant/35 dark:divide-white/8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-0 sm:divide-y-0">
              {organicHighlight.bullets.map((item, index) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.35,
                    delay: 0.08 + index * 0.05,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0 sm:py-4",
                    index % 2 === 0 && "sm:pr-2",
                    index % 2 === 1 && "sm:pl-2",
                    index < 2 && "sm:border-b sm:border-outline-variant/35 dark:sm:border-white/8",
                  )}
                >
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-warm-gold/12 text-warm-gold dark:bg-warm-gold/10">
                    <MaterialIcon name={item.icon} className="text-[22px]" />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-label-md text-sm leading-snug text-on-surface sm:text-[0.95rem]">
                      {item.title ?? item.label}
                    </p>
                    {item.detail ? (
                      <p className="text-xs leading-relaxed text-on-surface-variant sm:text-[13px]">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                </motion.li>
              ))}
            </ul>

            <div className="relative pt-1">
              <Link
                href={organicHighlight.ctaHref}
                className={cn(
                  "group inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 sm:w-auto",
                  "bg-primary font-label-md tracking-wide text-on-primary",
                  "shadow-[0_10px_28px_rgba(43,192,181,0.28)] dark:shadow-[0_12px_32px_rgba(61,212,200,0.18)]",
                  "transition-[transform,background-color] duration-200",
                  "hover:bg-primary/90 active:scale-[0.98]",
                )}
              >
                {organicHighlight.cta}
                <MaterialIcon
                  name="arrow_forward"
                  className="text-[20px] transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
