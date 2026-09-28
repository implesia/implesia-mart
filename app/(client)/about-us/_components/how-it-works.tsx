import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function HowItWorks({ className }: { className?: string }) {
  const { howItWorks } = aboutCopy;

  return (
    <section className={cn("w-full bg-[#f5f6f8] py-6 sm:py-8", className)}>
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
            {howItWorks.kicker}
          </p>
          <h2 className="mb-2 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-2xl">
            {howItWorks.title}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">{howItWorks.subtitle}</p>
        </div>

        <ol className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step) => (
            <li
              key={step.step}
              className="flex flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5"
            >
              <span className="mb-2 text-lg font-bold text-neutral-200">{step.step}</span>
              <span className="mb-2.5 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon name={step.icon} className="text-[18px]" />
              </span>
              <h3 className="mb-1 text-sm font-semibold text-neutral-950">{step.title}</h3>
              <p className="text-xs leading-relaxed text-neutral-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
