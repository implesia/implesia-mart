"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { checkoutCopy } from "../../_data/checkout/checkout";
import { useCart } from "../../_providers/cart-provider";

import { CheckoutFormProvider, useCheckoutForm } from "./checkout-form-context";
import { CheckoutMobileNav } from "./checkout-mobile-nav";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { CheckoutPageHeader } from "./checkout-page-header";
import { CheckoutPaymentMethod } from "./checkout-payment-method";
import { CheckoutShippingForm } from "./checkout-shipping-form";
import { CheckoutSuccess } from "./checkout-success";

type CheckoutViewProps = {
  seedSlug?: string;
  seedQty?: number;
  seedProductId?: string;
  seedVariantId?: string;
};

const pagePad =
  "px-4 pt-2 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 lg:pb-10";

export function CheckoutView({
  seedSlug,
  seedQty,
  seedProductId,
  seedVariantId,
}: CheckoutViewProps) {
  const { hydrated, items } = useCart();

  const productHref = seedSlug
    ? `/products/${seedSlug}`
    : items[0]
      ? `/products/${items[0].slug}`
      : "/products";

  if (!hydrated) {
    return (
      <div className="w-full bg-[#f5f6f8]">
        <Container className={cn(pagePad)}>
          <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90 sm:h-28" />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-12">
            <div className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90 sm:h-80 lg:col-span-7" />
            <div className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90 sm:h-80 lg:col-span-5" />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <CheckoutFormProvider
      source={seedSlug ? "direct" : "cart"}
      seedSlug={seedSlug}
      seedQty={seedQty}
      seedProductId={seedProductId}
      seedVariantId={seedVariantId}
    >
      <CheckoutReadyView productHref={productHref} />
    </CheckoutFormProvider>
  );
}

function CheckoutReadyView({ productHref }: { productHref: string }) {
  const { status, quote, quoteReady, pricingMessage } = useCheckoutForm();
  const hasItems = (quote?.items.length ?? 0) > 0;
  const succeeded = status === "success";

  if (!quoteReady && !succeeded) {
    return (
      <div className="w-full bg-[#f5f6f8]">
        <Container className={cn(pagePad)}>
          <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90 sm:h-28" />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-12">
            <div className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90 sm:h-80 lg:col-span-7" />
            <div className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90 sm:h-80 lg:col-span-5" />
          </div>
        </Container>
      </div>
    );
  }

  if (!hasItems && !succeeded) {
    return (
      <div className="w-full bg-[#f5f6f8]">
        <Container className={cn(pagePad, "lg:pb-10")}>
          <CheckoutPageHeader productHref="/products" />
          <section className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-10 text-center sm:px-10 sm:py-12">
            <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MaterialIcon
                name="remove_shopping_cart"
                className="text-[28px]"
              />
            </span>
            <h2 className="mb-2 text-xl font-semibold text-neutral-950">
              {checkoutCopy.emptyTitle}
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-neutral-600">
              {pricingMessage ?? checkoutCopy.emptyBody}
            </p>
            <Link
              href="/products"
              className="inline-flex h-10 w-full max-w-xs items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/80 sm:w-auto"
            >
              {checkoutCopy.emptyCta}
            </Link>
          </section>
        </Container>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "w-full bg-[#f5f6f8]",
          succeeded && "pointer-events-none",
        )}
        aria-hidden={succeeded || undefined}
      >
        <Container className={pagePad}>
          <CheckoutPageHeader productHref={productHref} />

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-6">
            <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
              <CheckoutShippingForm />
              <CheckoutPaymentMethod />
            </div>
            <CheckoutOrderSummary />
          </div>
        </Container>
      </div>

      {succeeded ? <CheckoutSuccess /> : <CheckoutMobileNav />}
    </>
  );
}
