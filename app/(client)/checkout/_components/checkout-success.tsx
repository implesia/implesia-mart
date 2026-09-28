"use client";

import Link from "next/link";

import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";

export function CheckoutSuccess() {
  return (
    <section className="rounded-2xl bg-white px-4 py-10 text-center ring-1 ring-neutral-200/90 sm:px-10 sm:py-12">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MaterialIcon name="check_circle" filled className="text-[32px]" />
      </span>
      <h2 className="mb-2 text-xl font-semibold text-neutral-950">{checkoutCopy.successTitle}</h2>
      <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-neutral-600">
        {checkoutCopy.successBody}
      </p>
      <div className="mx-auto flex w-full max-w-sm flex-col items-stretch justify-center gap-2 sm:max-w-none sm:flex-row sm:items-center">
        <Link
          href="/products"
          className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80 sm:w-auto"
        >
          {checkoutCopy.successShop}
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-8 text-sm font-semibold text-neutral-950 transition-colors hover:border-primary/40 sm:w-auto"
        >
          {checkoutCopy.successHome}
        </Link>
      </div>
    </section>
  );
}
