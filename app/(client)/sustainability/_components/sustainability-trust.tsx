import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { sustainabilityCopy } from "../../_data/sustainability/sustainability";

function Stars() {
  return (
    <div className="mb-4 flex gap-0.5 text-warm-gold">
      {Array.from({ length: 5 }).map((_, idx) => (
        <MaterialIcon key={idx} name="star" className="text-[16px]" filled />
      ))}
    </div>
  );
}

export function SustainabilityTrust({ className }: { className?: string }) {
  const { trust } = sustainabilityCopy;

  return (
    <section
      className={cn(
        "w-full bg-surface-container-low py-10 sm:py-14 lg:py-xl dark:bg-surface-container",
        className,
      )}
    >
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10 lg:mb-12">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-warm-gold/30 bg-warm-gold/10 px-3 py-1.5 text-xs font-semibold text-warm-gold">
            <MaterialIcon name="forum" className="text-[16px]" />
            {trust.kicker}
          </span>
          <h2 className="text-2xl leading-tight font-semibold text-primary sm:text-3xl lg:text-4xl">
            {trust.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {trust.testimonials.map((t) => (
            <div
              key={t.name}
              className={cn(
                "rounded-2xl p-6 sm:p-8",
                "bg-surface-container-lowest dark:bg-surface-container-high",
                "border border-outline-variant/35 dark:border-white/10",
              )}
            >
              <Stars />
              <p className="mb-6 text-sm leading-relaxed text-on-surface sm:text-base">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: t.accent }}
                >
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">{t.name}</h4>
                  <p className="text-xs text-on-surface-variant">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
