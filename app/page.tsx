import type { Metadata } from "next";

import { CategoryShowcaseSection } from "./(client)/_components/home/brands-categories-section";
import { FaqSection } from "./(client)/_components/home/faq-section";
import { CategoriesStripSection } from "./(client)/_components/home/categories-strip-section";
import { FeaturedProductsSection } from "./(client)/_components/home/featured-products-section";
import { HeroSection } from "./(client)/_components/home/hero-section";
import { HomeTrustStrip } from "./(client)/_components/home/home-trust-strip";
import { NewsletterSection } from "./(client)/_components/home/newsletter-section";
import { TestimonialsSection } from "./(client)/_components/home/testimonials-section";
import { JsonLd } from "./(client)/_components/common/json-ld";
import { faqSections } from "./(client)/_data/home/home";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  /* Absolute form bypasses the root layout's "%s | Site Name" template,
   * since DEFAULT_TITLE is already the fully-formed home page title. */
  title: { absolute: DEFAULT_TITLE },
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
      <main className="force-light bg-[#f5f6f8] text-neutral-950">
        <HeroSection />
        <HomeTrustStrip />
        <CategoriesStripSection />
        <FeaturedProductsSection />
        <CategoryShowcaseSection />
        <TestimonialsSection />
        <FaqSection />
        <NewsletterSection />
      </main>
    </>
  );
}
