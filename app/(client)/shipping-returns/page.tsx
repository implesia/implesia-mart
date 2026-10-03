import type { Metadata } from "next";

import { getStoreDeliveryRates } from "@/lib/mart-api/catalog";
import { listPublicShippingBlock } from "@/lib/mart-api/shipping-block";
import { listPublicShippingFaq } from "@/lib/mart-api/shipping-faq";
import { listPublicShippingPayment } from "@/lib/mart-api/shipping-payment";
import { listPublicShippingRefund } from "@/lib/mart-api/shipping-refund";
import { listPublicShippingSupport } from "@/lib/mart-api/shipping-support";
import { listPublicShippingReturns } from "@/lib/mart-api/shipping-returns";
import { listPublicShippingContents } from "@/lib/mart-api/shipping-contents";
import { listPublicShippingHero } from "@/lib/mart-api/shipping-hero";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { ShippingReturnsView } from "./_components/shipping-returns-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "শিপিং ও রিটার্ন",
  description:
    "ইমপ্লেসিয়া মার্ট — সারাদেশে ডেলিভারি, ক্যাশ অন ডেলিভারি, ৩ দিনের ইজি রিটার্ন ও রিফান্ড নীতিমালা।",
  alternates: { canonical: "/shipping-returns" },
};

export default async function ShippingReturnsPage() {
  const [rates, hero, contents, shipping, payment, returns, refund, support, faq] =
    await Promise.all([
      getStoreDeliveryRates(),
      listPublicShippingHero(),
      listPublicShippingContents(),
      listPublicShippingBlock(),
      listPublicShippingPayment(),
      listPublicShippingReturns(),
      listPublicShippingRefund(),
      listPublicShippingSupport(),
      listPublicShippingFaq(),
    ]);
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[{ label: "হোম", href: "/" }, { label: "শিপিং ও রিটার্ন" }]}
          />
        </div>
      </Container>
      <ShippingReturnsView
        rates={rates}
        hero={hero}
        contents={contents}
        shipping={shipping}
        payment={payment}
        returns={returns}
        refund={refund}
        support={support}
        faq={faq}
      />
    </main>
  );
}
