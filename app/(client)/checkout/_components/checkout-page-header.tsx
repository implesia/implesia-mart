import Link from "next/link";

import { checkoutCopy } from "../../_data/checkout/checkout";
import { MaterialIcon } from "../../_components/common/material-icon";

export function CheckoutPageHeader({ productHref }: { productHref?: string }) {
  return (
    <header className="mb-5 space-y-3 sm:mb-6">
      {productHref ? (
        <Link
          href={productHref}
          className="inline-flex min-h-6 items-center gap-1.5 text-xs text-neutral-600 transition-colors hover:text-primary sm:text-sm"
        >
          <MaterialIcon name="arrow_back" className="text-[18px]" />
          {checkoutCopy.backToProduct}
        </Link>
      ) : null}

      <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-200/90 sm:px-6 sm:py-5">
        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-primary sm:text-xs">
          {checkoutCopy.pageEyebrow}
        </p>
        <h1 className="text-xl leading-snug font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          {checkoutCopy.pageTitle}
        </h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-neutral-600">
          {checkoutCopy.pageSubtitle}
        </p>
      </div>
    </header>
  );
}
