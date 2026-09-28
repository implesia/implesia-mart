import type { Metadata } from "next";

import { ArrivalsRankingsSection } from "./(client)/_components/home/arrivals-rankings-section";
import { BrandsSection, CategoryShowcaseSection } from "./(client)/_components/home/brands-categories-section";
import { SpotlightRailsSection } from "./(client)/_components/home/spotlight-rails-section";
import { StorePromisesSection } from "./(client)/_components/home/store-promises-section";
import { FaqSection } from "./(client)/_components/home/faq-section";
import { CategoriesStripSection } from "./(client)/_components/home/categories-strip-section";
import { FeaturedProductsSection } from "./(client)/_components/home/featured-products-section";
import { LatestProductsSection } from "./(client)/_components/home/latest-products-section";
import { HeroSection } from "./(client)/_components/home/hero-section";
import { NewsletterSection } from "./(client)/_components/home/newsletter-section";
import { OrganicHighlightSection } from "./(client)/_components/home/organic-highlight-section";
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
      <main>
        <HeroSection />
        <FeaturedProductsSection />
        <CategoriesStripSection />
        <LatestProductsSection />
        <ArrivalsRankingsSection />
        <BrandsSection />
        <CategoryShowcaseSection />
        <SpotlightRailsSection />
        <StorePromisesSection />
        <OrganicHighlightSection />
        <TestimonialsSection />
        <FaqSection />
        <NewsletterSection />
      </main>
    </>
  );
}
