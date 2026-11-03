import type { Metadata } from "next";

import { isCatalogProductId } from "@/lib/mart-api/catalog-rules";
import { getPublicPaymentSettings } from "@/lib/mart-api/payment-settings";
import { purchaseQuantity } from "@/lib/mart-api/product-page";
import { DEFAULT_DESCRIPTION, pageMetadata } from "@/lib/seo";

import { Container } from "../_components/common/container";
import { PaymentQrProvider } from "../_providers/payment-qr-provider";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { CheckoutView } from "./_components/checkout-view";

export const metadata: Metadata = pageMetadata({
  title: "চেকআউট",
  description: DEFAULT_DESCRIPTION,
  path: "/checkout",
  noindex: { follow: false },
});

type CheckoutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.product;
  const productSlug = Array.isArray(raw) ? raw[0] : raw;
  const rawQty = Array.isArray(sp.qty) ? sp.qty[0] : sp.qty;
  const parsedQty = rawQty ? Number.parseInt(rawQty, 10) : undefined;
  const quantity =
    parsedQty !== undefined && Number.isFinite(parsedQty)
      ? purchaseQuantity(parsedQty)
      : undefined;
  const rawId = Array.isArray(sp.id) ? sp.id[0] : sp.id;
  const productId = rawId && isCatalogProductId(rawId) ? rawId : undefined;
  const rawVariant = Array.isArray(sp.variant) ? sp.variant[0] : sp.variant;
  const variantId =
    rawVariant && isCatalogProductId(rawVariant) ? rawVariant : undefined;
  const payment = await getPublicPaymentSettings();

  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[{ label: "হোম", href: "/" }, { label: "চেকআউট" }]}
          />
        </div>
      </Container>
      <PaymentQrProvider qrSrc={payment.qrSrc}>
        <CheckoutView
          seedSlug={productSlug}
          seedQty={quantity}
          seedProductId={productId}
          seedVariantId={variantId}
        />
      </PaymentQrProvider>
    </main>
  );
}
