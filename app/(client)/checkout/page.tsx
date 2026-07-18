import { Container } from "../_components/common/container";
import { buildCheckoutCart } from "../_data/checkout/checkout";

import { CheckoutMobileNav } from "./_components/checkout-mobile-nav";
import { CheckoutOrderSummary } from "./_components/checkout-order-summary";
import { CheckoutPageHeader } from "./_components/checkout-page-header";
import { CheckoutPaymentMethod } from "./_components/checkout-payment-method";
import { CheckoutShippingForm } from "./_components/checkout-shipping-form";

type CheckoutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.product;
  const productSlug = Array.isArray(raw) ? raw[0] : raw;
  const rawQty = Array.isArray(sp.qty) ? sp.qty[0] : sp.qty;
  const quantity = rawQty ? Number.parseInt(rawQty, 10) : undefined;
  const cart = buildCheckoutCart({ productSlug, quantity });
  const productHref = productSlug ? `/products/${productSlug}` : "/products";

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
            <CheckoutOrderSummary cart={cart} />
          </div>
        </Container>
      </div>

      <CheckoutMobileNav cart={cart} />
    </>
  );
}
