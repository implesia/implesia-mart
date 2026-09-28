import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function ShopCta({ className }: { className?: string }) {
  const { shopCta } = aboutCopy;

  return (
    <section className={cn("w-full py-6 sm:py-8 lg:py-10", className)}>
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl px-4 py-8 text-center sm:rounded-3xl sm:px-8 sm:py-10",
            "bg-[#062f2c]",
            "ring-1 ring-black/10",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_10%_0%,rgba(43,192,181,0.28),transparent_50%),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(245,179,1,0.12),transparent_45%)]"
          />

          <div className="relative z-10 mx-auto max-w-lg">
            <h2 className="mb-2 text-xl leading-tight font-semibold text-white sm:text-2xl lg:text-[1.85rem]">
              {shopCta.title}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-white/70">
              {shopCta.subtitle}
            </p>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href={shopCta.primaryCta.href}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold sm:px-6",
                  "bg-warm-gold text-on-surface",
                  "transition-colors hover:bg-warm-gold/90 active:scale-[0.98]",
                )}
              >
                {shopCta.primaryCta.label}
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
              <Link
                href={shopCta.secondaryCta.href}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white sm:px-6",
                  "transition-colors hover:bg-white/10",
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
