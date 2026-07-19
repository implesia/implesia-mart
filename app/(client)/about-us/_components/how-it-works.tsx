import { Fragment } from "react";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { aboutCopy } from "../../_data/about/about";

export function HowItWorks({ className }: { className?: string }) {
  const { howItWorks } = aboutCopy;

  return (
    <section
      className={cn(
        "w-full bg-surface-container-low py-10 sm:py-14 lg:py-xl dark:bg-surface-container",
        className,
      )}
    >
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10 lg:mb-12">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary dark:border-primary/25 dark:bg-primary/12">
            <MaterialIcon name="checklist" className="text-[16px]" />
            {howItWorks.kicker}
          </span>
          <h2 className="mb-3 text-2xl leading-tight font-semibold text-primary sm:text-3xl lg:text-4xl">
            {howItWorks.title}
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant sm:text-base">
            {howItWorks.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch lg:gap-0">
          {howItWorks.steps.map((step, index) => (
            <Fragment key={step.step}>
              <div
                className={cn(
                  "relative flex flex-col rounded-2xl p-5 sm:p-6",
                  "bg-surface-container-lowest dark:bg-surface-container-high",
                  "border border-outline-variant/35 dark:border-white/10",
                )}
              >
                <span className="mb-4 text-2xl font-bold text-outline-variant/60 sm:text-3xl dark:text-white/15">
                  {step.step}
                </span>
                <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-14 dark:bg-primary/15">
                  <MaterialIcon name={step.icon} className="text-[24px] sm:text-[26px]" />
                </span>
                <h3 className="mb-2 text-sm font-semibold text-on-surface sm:text-base">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-on-surface-variant sm:text-sm">
                  {step.description}
                </p>
              </div>

              {index < howItWorks.steps.length - 1 ? (
                <div className="hidden items-center justify-center px-2 lg:flex">
                  <MaterialIcon
                    name="arrow_forward"
                    className="text-[20px] text-outline-variant/50 dark:text-white/20"
                  />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </Container>
    </section>
  );
}
