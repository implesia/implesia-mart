"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Container } from "../../_components/common/container";
import { MaterialIcon } from "../../_components/common/material-icon";
import { useCart } from "../../_providers/cart-provider";

import {
  CheckoutFormProvider,
  useCheckoutForm,
} from "./checkout-form-context";
import { CheckoutMobileNav } from "./checkout-mobile-nav";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { CheckoutPageHeader } from "./checkout-page-header";
import { CheckoutPaymentMethod } from "./checkout-payment-method";
import { CheckoutShippingForm } from "./checkout-shipping-form";
import { CheckoutSuccess } from "./checkout-success";

type CheckoutViewProps = {
  seedSlug?: string;
  seedQty?: number;
};

const pageShell =
  "min-h-[calc(100dvh-6.5rem)] overflow-x-hidden bg-surface-container-low sm:min-h-[calc(100dvh-8rem)] lg:min-h-[calc(100dvh-9.25rem)]";

const pagePad =
  "px-4 pt-4 pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 lg:pb-16";

export function CheckoutView({ seedSlug, seedQty }: CheckoutViewProps) {
  const router = useRouter();
  const { hydrated, items, addItem } = useCart();
  const seededRef = useRef(false);
  const [seedReady, setSeedReady] = useState(!seedSlug);

  useEffect(() => {
    if (!hydrated || seededRef.current) return;

    if (!seedSlug) {
      setSeedReady(true);
      return;
    }

    const ok = addItem(seedSlug, seedQty ?? 1, { openDrawer: false });
    seededRef.current = true;
    setSeedReady(true);
    if (ok) {
      router.replace("/checkout", { scroll: false });
    }
  }, [hydrated, seedSlug, seedQty, addItem, router]);

  const productHref = seedSlug
    ? `/products/${seedSlug}`
    : items[0]
      ? `/products/${items[0].slug}`
      : "/products";

  if (!hydrated || !seedReady) {
    return (
      <div className={pageShell}>
        <Container className={cn(pagePad, "lg:pb-16")}>
          <div className="h-24 animate-pulse rounded-2xl bg-surface-container sm:h-28" />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="h-72 animate-pulse rounded-2xl bg-surface-container sm:h-80 lg:col-span-7" />
            <div className="h-72 animate-pulse rounded-2xl bg-surface-container sm:h-80 lg:col-span-5" />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <CheckoutFormProvider>
      <CheckoutReadyView
        productHref={productHref}
        hasItems={items.length > 0}
      />
    </CheckoutFormProvider>
  );
}

function CheckoutReadyView({
  productHref,
  hasItems,
}: {
  productHref: string;
  hasItems: boolean;
}) {
  const { status } = useCheckoutForm();

  if (status === "success") {
    return (
      <div className={pageShell}>
        <Container className={cn(pagePad, "lg:pb-16")}>
          <CheckoutPageHeader productHref="/products" />
          <CheckoutSuccess />
        </Container>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className={pageShell}>
        <Container className={cn(pagePad, "lg:pb-16")}>
          <CheckoutPageHeader productHref="/products" />
          <section className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-4 py-12 text-center sm:px-10 sm:py-16">
            <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-16">
              <MaterialIcon name="remove_shopping_cart" className="text-[28px] sm:text-[32px]" />
            </span>
            <h2 className="mb-2 text-xl font-semibold text-on-background sm:text-2xl">
              কার্টে কোনো আইটেম নেই
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-on-surface-variant sm:mb-8 sm:text-base">
              অর্ডার করতে আগে প্রোডাক্ট কার্টে যোগ করুন, অথবা প্রোডাক্ট পেজ থেকে সরাসরি অর্ডার
              করুন।
            </p>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 w-full max-w-xs rounded-full px-8 sm:h-12 sm:w-auto",
              )}
            >
              প্রোডাক্ট দেখুন
            </Link>
          </section>
        </Container>
      </div>
    );
  }

  return (
    <>
      <div className={pageShell}>
        <Container className={pagePad}>
          <CheckoutPageHeader productHref={productHref} />

          <div className="grid grid-cols-1 items-start gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:col-span-7">
              <CheckoutShippingForm />
              <CheckoutPaymentMethod />
            </div>
            <CheckoutOrderSummary />
          </div>
        </Container>
      </div>

      <CheckoutMobileNav />
    </>
  );
}
