import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { JsonLd } from "../_components/common/json-ld";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { shippingReturnsCopy } from "../_data/shipping/shipping-returns";
import { ShippingReturnsView } from "./_components/shipping-returns-view";

export const metadata: Metadata = {
  title: "শিপিং ও রিটার্ন",
  description:
    "ইমপ্লেসিয়া মার্ট — সারাদেশে ডেলিভারি, ক্যাশ অন ডেলিভারি, ৩ দিনের ইজি রিটার্ন ও রিফান্ড নীতিমালা।",
  alternates: { canonical: "/shipping-returns" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: shippingReturnsCopy.miniFaq.items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function ShippingReturnsPage() {
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <JsonLd data={faqJsonLd} />
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "শিপিং ও রিটার্ন" },
            ]}
          />
        </div>
      </Container>
      <ShippingReturnsView />
    </main>
  );
}
