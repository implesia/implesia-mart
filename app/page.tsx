import type { Metadata } from "next";

import { BestSellingSection } from "./(client)/_components/home/best-selling-section";
import { FaqSection } from "./(client)/_components/home/faq-section";
import { FlashSaleSection } from "./(client)/_components/home/flash-sale-section";
import { HeroSection } from "./(client)/_components/home/hero-section";
import { NewsletterSection } from "./(client)/_components/home/newsletter-section";
import { OrganicHighlightSection } from "./(client)/_components/home/organic-highlight-section";
import { TestimonialsSection } from "./(client)/_components/home/testimonials-section";
import { JsonLd } from "./(client)/_components/common/json-ld";
import { faqSections } from "./(client)/_data/home/home";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqSections.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <main className="pt-16 sm:pt-20">
        <HeroSection />
        <BestSellingSection />
        <FlashSaleSection />
        <OrganicHighlightSection />
        <TestimonialsSection />
        <FaqSection />
        <NewsletterSection />
      </main>
    </>
  );
}
