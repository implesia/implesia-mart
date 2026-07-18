import Link from "next/link";

import { checkoutCopy, checkoutSteps } from "../../_data/checkout/checkout";
import { MaterialIcon } from "../../_components/common/material-icon";

export function CheckoutPageHeader({
  productHref,
}: {
  productHref?: string;
}) {
  return (
    <header className="mb-6 space-y-4 lg:mb-8">
      {productHref ? (
        <Link
          href={productHref}
          className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <MaterialIcon name="arrow_back" className="text-[18px]" />
          {checkoutCopy.backToProduct}
        </Link>
      ) : null}

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-primary">
              <MaterialIcon name="lock" className="text-[18px]" />
              <span className="font-label-md text-primary">{checkoutCopy.pageEyebrow}</span>
            </div>
            <h1 className="font-headline-sm text-on-background sm:text-[28px] sm:leading-snug">
              {checkoutCopy.pageTitle}
            </h1>
            <p className="mt-1 max-w-lg text-body-md text-on-surface-variant">
              {checkoutCopy.pageSubtitle}
            </p>
          </div>

          <ol className="flex shrink-0 items-center justify-between gap-1 rounded-xl bg-surface-container-low p-2 sm:justify-start sm:gap-1">
            {checkoutSteps.map((step, index) => {
              const active = index === 0;
              return (
                <li key={step.id} className="flex items-center gap-1">
                  {index > 0 ? (
                    <span
                      className="mx-1 hidden h-px w-5 bg-outline-variant/50 sm:block"
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className={
                      active
                        ? "flex items-center gap-2 rounded-lg bg-surface-container-lowest px-2.5 py-2 shadow-sm ring-1 ring-outline-variant/20"
                        : "flex items-center gap-2 px-2.5 py-2"
                    }
                  >
                    <span
                      className={
                        active
                          ? "flex size-7 items-center justify-center rounded-full bg-primary text-label-sm text-primary-foreground"
                          : "flex size-7 items-center justify-center rounded-full bg-surface-container text-label-sm text-outline"
                      }
                    >
                      {step.id}
                    </span>
                    <span
                      className={
                        active
                          ? "text-label-sm font-semibold text-on-surface"
                          : "text-label-sm text-outline"
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </header>
  );
}
