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
      <div className="min-h-[calc(100vh-5rem)] bg-surface-container-low pb-28 lg:pb-16">
        <Container className="px-5 pt-24 sm:px-8 sm:pt-28">
          <div className="h-28 animate-pulse rounded-2xl bg-surface-container" />
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="h-80 animate-pulse rounded-2xl bg-surface-container lg:col-span-7" />
            <div className="h-80 animate-pulse rounded-2xl bg-surface-container lg:col-span-5" />
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
      <div className="min-h-[calc(100vh-5rem)] bg-surface-container-low pb-16">
        <Container className="px-5 pt-24 sm:px-8 sm:pt-28">
          <CheckoutPageHeader productHref="/products" />
          <CheckoutSuccess />
        </Container>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-surface-container-low pb-16">
        <Container className="px-5 pt-24 sm:px-8 sm:pt-28">
          <CheckoutPageHeader productHref="/products" />
          <section className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-6 py-16 text-center sm:px-10">
            <span className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MaterialIcon name="remove_shopping_cart" className="text-[32px]" />
            </span>
            <h2 className="mb-2 font-headline-sm text-on-background">
              কার্টে কোনো আইটেম নেই
            </h2>
            <p className="mx-auto mb-8 max-w-md text-body-md text-on-surface-variant">
              অর্ডার করতে আগে প্রোডাক্ট কার্টে যোগ করুন, অথবা প্রোডাক্ট পেজ থেকে সরাসরি অর্ডার
              করুন।
            </p>
            <Link
              href="/products"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
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
      <div className="min-h-[calc(100vh-5rem)] bg-surface-container-low pb-28 lg:pb-16">
        <Container className="px-5 pt-24 sm:px-8 sm:pt-28">
          <CheckoutPageHeader productHref={productHref} />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col gap-6 lg:col-span-7">
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
