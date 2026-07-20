import Link from "next/link";

import { checkoutCopy, checkoutSteps } from "../../_data/checkout/checkout";
import { MaterialIcon } from "../../_components/common/material-icon";

export function CheckoutPageHeader({
  productHref,
}: {
  productHref?: string;
}) {
  return (
    <header className="mb-5 space-y-3 sm:mb-6 sm:space-y-4 lg:mb-8">
      {productHref ? (
        <Link
          href={productHref}
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant transition-colors hover:text-primary sm:text-sm"
        >
          <MaterialIcon name="arrow_back" className="text-[18px]" />
          {checkoutCopy.backToProduct}
        </Link>
      ) : null}

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-3.5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-primary">
              <MaterialIcon name="lock" className="text-[16px] sm:text-[18px]" />
              <span className="text-xs font-semibold tracking-wide text-primary sm:text-sm">
                {checkoutCopy.pageEyebrow}
              </span>
            </div>
            <h1 className="text-xl leading-snug font-semibold tracking-tight text-on-background sm:text-2xl lg:text-[28px]">
              {checkoutCopy.pageTitle}
            </h1>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {checkoutCopy.pageSubtitle}
            </p>
          </div>

          <ol
            className="flex w-full shrink-0 items-stretch gap-1 overflow-x-auto rounded-xl bg-surface-container-low p-1.5 sm:w-auto sm:justify-start sm:gap-1 sm:p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="চেকআউট ধাপ"
          >
            {checkoutSteps.map((step, index) => {
              const active = index === 0;
              return (
                <li key={step.id} className="flex min-w-0 flex-1 items-center sm:flex-none">
                  {index > 0 ? (
                    <span
                      className="mx-0.5 hidden h-px w-4 shrink-0 bg-outline-variant/50 sm:mx-1 sm:block sm:w-5"
                      aria-hidden
                    />
                  ) : null}
                  <div
                    className={
                      active
                        ? "flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest px-2 py-2 shadow-sm ring-1 ring-outline-variant/20 sm:w-auto sm:justify-start sm:gap-2 sm:px-2.5"
                        : "flex w-full items-center justify-center gap-1.5 px-2 py-2 sm:w-auto sm:justify-start sm:gap-2 sm:px-2.5"
                    }
                  >
                    <span
                      className={
                        active
                          ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground sm:size-7 sm:text-xs"
                          : "flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-container text-[11px] font-semibold text-outline sm:size-7 sm:text-xs"
                      }
                    >
                      {step.id}
                    </span>
                    <span
                      className={
                        active
                          ? "truncate text-[11px] font-semibold text-on-surface sm:text-xs"
                          : "truncate text-[11px] text-outline sm:text-xs"
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
