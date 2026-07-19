import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { contactCopy } from "../../_data/contact/contact";

export function ContactHero({ className }: { className?: string }) {
  const { hero } = contactCopy;

  return (
    <section className={cn("w-full pt-6 pb-6 sm:pt-8 sm:pb-8 lg:pt-10 lg:pb-10", className)}>
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
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_10%_0%,rgba(43,192,181,0.3),transparent_50%),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(245,179,1,0.14),transparent_45%)]"
          />

          <div className="relative z-10 mx-auto max-w-xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-sm">
              <span className="size-1.5 shrink-0 rounded-full bg-warm-gold" />
              {hero.eyebrow}
            </span>

            <h1 className="mb-3 text-2xl leading-tight font-semibold text-white sm:text-3xl lg:text-4xl">
              {hero.title}
            </h1>
            <p className="text-sm leading-relaxed text-white/70 sm:text-base">
              {hero.subtitle}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
