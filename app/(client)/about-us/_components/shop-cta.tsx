import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function ShopCta({ className }: { className?: string }) {
  const { shopCta } = aboutCopy;

  return (
    <section className={cn("w-full py-10 sm:py-14 lg:py-xl", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl px-5 py-10 text-center sm:rounded-3xl sm:px-10 sm:py-12 md:px-14 md:py-14",
            "bg-[#062f2c] dark:bg-[#041f1d]",
            "ring-1 ring-black/10 dark:ring-primary/15",
            "shadow-[0_20px_50px_rgba(6,47,44,0.18)] dark:shadow-[0_24px_56px_rgba(0,0,0,0.45)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_10%_0%,rgba(43,192,181,0.28),transparent_50%),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(245,179,1,0.12),transparent_45%)]"
          />

          <div className="relative z-10 mx-auto max-w-xl">
            <h2 className="mb-3 text-2xl leading-tight font-semibold text-white sm:text-3xl lg:text-4xl">
              {shopCta.title}
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-white/70 sm:text-base">
              {shopCta.subtitle}
            </p>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={shopCta.primaryCta.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 sm:px-8",
                  "bg-warm-gold text-sm font-semibold text-on-surface",
                  "transition-colors hover:bg-warm-gold/90 active:scale-[0.98]",
                )}
              >
                {shopCta.primaryCta.label}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                href={shopCta.secondaryCta.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 sm:px-8",
                  "text-sm font-semibold text-white transition-colors hover:bg-white/10",
                )}
              >
                {shopCta.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
