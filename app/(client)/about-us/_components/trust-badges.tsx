import type { AboutValues } from "@/lib/mart-api/about-values";
import { valueIcon } from "@/lib/mart-api/about-values";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function TrustBadges({
  values,
  className,
}: {
  values: AboutValues;
  className?: string;
}) {
  const items = values.items.filter((item) => item.title.trim() && item.description.trim());
  if (!values.kicker && !values.title && !values.subtitle && !items.length) return null;

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          {values.kicker ? (
            <p className="mb-2 text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
              {values.kicker}
            </p>
          ) : null}
          {values.title ? (
            <h2 className="mb-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {values.title}
            </h2>
          ) : null}
          {values.subtitle ? (
            <p className="text-sm leading-relaxed text-neutral-600">{values.subtitle}</p>
          ) : null}
        </div>

        {items.length ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200/90 bg-white p-4 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5"
              >
                <span className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MaterialIcon name={valueIcon(item.icon)} filled className="text-[20px]" />
                </span>
                <h3 className="mb-1 text-sm font-semibold text-neutral-950">{item.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
