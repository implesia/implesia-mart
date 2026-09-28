import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function TrustBadges({ className }: { className?: string }) {
  const { values } = aboutCopy;

  return (
    <section className={cn("w-full py-6 sm:py-8 lg:py-10", className)}>
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-warm-gold/30 bg-warm-gold/10 px-2.5 py-1 text-xs font-semibold text-on-surface">
            <MaterialIcon name="workspace_premium" className="text-[14px]" />
            {values.kicker}
          </span>
          <h2 className="mb-2 text-xl leading-tight font-semibold text-neutral-950 sm:text-2xl">
            {values.title}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {values.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          {values.items.map((item) => (
            <div
              key={item.title}
              className={cn(
                "rounded-xl p-3.5 text-center sm:rounded-2xl sm:p-5",
                "bg-white",
                "border border-neutral-200/90",
              )}
            >
              <span className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-11">
                <MaterialIcon name={item.icon} filled className="text-[20px]" />
              </span>
              <h3 className="mb-1 text-sm font-semibold text-neutral-950">
                {item.title}
              </h3>
              <p className="text-[11px] leading-relaxed text-neutral-600 sm:text-xs">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
