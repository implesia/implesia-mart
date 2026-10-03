import type { AboutSteps } from "@/lib/mart-api/about-steps";
import { stepIcon } from "@/lib/mart-api/about-steps";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";

export function HowItWorks({
  steps,
  className,
}: {
  steps: AboutSteps;
  className?: string;
}) {
  const items = steps.items.filter(
    (item) => item.step.trim() && item.title.trim() && item.description.trim(),
  );
  if (!steps.kicker && !steps.title && !steps.subtitle && !items.length) return null;

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          {steps.kicker ? (
            <p className="mb-2 text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
              {steps.kicker}
            </p>
          ) : null}
          {steps.title ? (
            <h2 className="mb-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {steps.title}
            </h2>
          ) : null}
          {steps.subtitle ? (
            <p className="text-sm leading-relaxed text-neutral-600">{steps.subtitle}</p>
          ) : null}
        </div>

        {items.length ? (
          <ol className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5"
              >
                <span className="mb-2 text-lg font-bold text-neutral-200">{item.step}</span>
                <span className="mb-2.5 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MaterialIcon name={stepIcon(item.icon)} className="text-[18px]" />
                </span>
                <h3 className="mb-1 text-sm font-semibold text-neutral-950">{item.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-600">{item.description}</p>
              </li>
            ))}
          </ol>
        ) : null}
      </Container>
    </section>
  );
}
