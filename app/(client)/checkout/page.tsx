import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { CheckoutView } from "./_components/checkout-view";

export const metadata: Metadata = {
  title: "চেকআউট",
  robots: { index: false, follow: false },
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
  const quantity = parsedQty && Number.isFinite(parsedQty) ? parsedQty : undefined;

  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "চেকআউট" },
            ]}
          />
        </div>
      </Container>
      <CheckoutView seedSlug={productSlug} seedQty={quantity} />
    </main>
  );
}
