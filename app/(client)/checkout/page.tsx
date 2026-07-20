import type { Metadata } from "next";

import { CheckoutView } from "./_components/checkout-view";

export const metadata: Metadata = {
  title: "চেকআউট",
  robots: { index: false, follow: true },
};

type CheckoutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.product;
  const productSlug = Array.isArray(raw) ? raw[0] : raw;
  const rawQty = Array.isArray(sp.qty) ? sp.qty[0] : sp.qty;
  const parsedQty = rawQty ? Number.parseInt(rawQty, 10) : undefined;
  const quantity =
    parsedQty && Number.isFinite(parsedQty) ? parsedQty : undefined;

  return <CheckoutView seedSlug={productSlug} seedQty={quantity} />;
}
