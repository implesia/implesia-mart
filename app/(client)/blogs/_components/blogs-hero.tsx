"use client";

import { type BlogHero } from "@/lib/mart-api/blog-hero";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";

export function BlogsHero({
  hero,
  count = 0,
  className,
}: {
  hero: BlogHero | null;
  count?: number;
  className?: string;
}) {
  // The page still needs one h1 when the hero is switched off or has no title.
  if (!hero?.isActive || !hero.title.trim()) return <h1 className="sr-only">ব্লগ</h1>;
  const postCount = count;

  return (
    <section className={cn("w-full bg-[#f5f6f8] pb-5 sm:pb-6", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl px-4 py-8 sm:px-8 sm:py-10",
            "bg-[linear-gradient(100deg,#071820_0%,#070c14_46%,#05060a_100%)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(43,192,181,0.22),transparent_55%)]"
          />

          <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8">
            <div className="max-w-lg">
              {hero.eyebrow.trim() ? (
                <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
                  {hero.eyebrow}
                </p>
              ) : null}
              {hero.title.trim() ? (
                <h1 className="mb-3 text-[1.35rem] leading-[1.2] font-bold tracking-tight text-white sm:mb-3 sm:text-3xl lg:text-[2.15rem]">
                  {hero.title}
                </h1>
              ) : null}
              {hero.subtitle.trim() ? (
                <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                  {hero.subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex items-baseline gap-2 border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
              <p className="text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
                {postCount}
              </p>
              {hero.countLabel.trim() ? (
                <p className="text-xs text-white/55">{hero.countLabel}</p>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
