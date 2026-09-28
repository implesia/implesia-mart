import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { JsonLd } from "../_components/common/json-ld";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { faqsCopy } from "../_data/faqs/faqs";
import { FaqsView } from "./_components/faqs-view";

export const metadata: Metadata = {
  title: "প্রশ্নোত্তর",
  description:
    "ইমপ্লেসিয়া মার্ট — অর্ডার, ডেলিভারি, ক্যাশ অন ডেলিভারি, রিটার্ন ও গর্জিয়াস ড্রেস নিয়ে সাধারণ প্রশ্নের উত্তর।",
  alternates: { canonical: "/faqs" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqsCopy.items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function FaqsPage() {
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <JsonLd data={faqJsonLd} />
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "প্রশ্নোত্তর" },
            ]}
          />
        </div>
      </Container>
      <FaqsView />
    </main>
  );
}
