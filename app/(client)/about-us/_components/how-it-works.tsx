import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function HowItWorks({ className }: { className?: string }) {
  const { howItWorks } = aboutCopy;

  return (
    <section className={cn("w-full bg-white py-6 sm:py-8 lg:py-10", className)}>
      <Container className="w-full px-3 min-[400px]:px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-6">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">
            <MaterialIcon name="checklist" className="text-[14px]" />
            {howItWorks.kicker}
          </span>
          <h2 className="mb-2 text-xl leading-tight font-semibold text-neutral-950 sm:text-2xl">
            {howItWorks.title}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {howItWorks.subtitle}
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {howItWorks.steps.map((step) => (
            <li
              key={step.step}
              className={cn(
                "flex flex-col rounded-xl p-4 sm:rounded-2xl sm:p-5",
                "bg-[#f5f6f8]",
                "border border-neutral-200/90",
              )}
            >
              <span className="mb-2 text-lg font-bold text-neutral-300 sm:text-xl">
                {step.step}
              </span>
              <span className="mb-2.5 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon name={step.icon} className="text-[18px]" />
              </span>
              <h3 className="mb-1 text-sm font-semibold text-neutral-950">
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
