import type { Metadata } from "next";

import { JsonLd } from "../_components/common/json-ld";
import { faqsCopy } from "../_data/faqs/faqs";
import { FaqsView } from "./_components/faqs-view";

export const metadata: Metadata = {
  title: "প্রশ্নোত্তর",
  description:
    "ইমপ্লেসিয়া মার্ট — অর্ডার, ডেলিভারি, পেমেন্ট, প্রোডাক্ট ও যত্ন সম্পর্কিত সাধারণ প্রশ্নের উত্তর।",
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
    <main className="w-full overflow-x-hidden bg-background pt-16 text-on-surface sm:pt-20">
      <JsonLd data={faqJsonLd} />
      <FaqsView />
    </main>
  );
}
