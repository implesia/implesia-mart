import { CheckoutMobileNav } from "./_components/checkout-mobile-nav";
import { CheckoutOrderSummary } from "./_components/checkout-order-summary";
import { CheckoutPaymentMethod } from "./_components/checkout-payment-method";
import { CheckoutShippingForm } from "./_components/checkout-shipping-form";

import { buildCheckoutCart } from "../_data/checkout/checkout";

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

  return (
    <>
      <div className="min-h-[calc(100vh-5rem)] bg-[#f6f8f6] dark:bg-background">
        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-xl px-6 pt-28 pb-28 lg:grid-cols-12 lg:px-8">
        <div className="flex flex-col gap-lg lg:col-span-7">
          <CheckoutShippingForm />
          <CheckoutPaymentMethod />
        </div>
        <CheckoutOrderSummary cart={cart} />
        </main>
      </div>

      <CheckoutMobileNav />
    </>
  );
}

