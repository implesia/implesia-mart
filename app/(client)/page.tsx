import type { Metadata } from "next";

import { CategoryShowcaseSection } from "./_components/home/brands-categories-section";
import { FaqSection } from "./_components/home/faq-section";
import { FeaturedProductsSection } from "./_components/home/featured-products-section";
import { HeroSection } from "./_components/home/hero-section";
import { HomeTrustStrip } from "./_components/home/home-trust-strip";
import { NewsletterSection } from "./_components/home/newsletter-section";
import { TestimonialsSection } from "./_components/home/testimonials-section";
import { Container } from "./_components/common/container";
import { JsonLd } from "./_components/common/json-ld";
import { loadStoreCatalog } from "@/lib/mart-api/catalog";
import { listPublicHeroSlides } from "@/lib/mart-api/hero";
import { FALLBACK_CATEGORIES, listPublicCategories } from "@/lib/mart-api/categories";
import { FALLBACK_FAQ, listPublicFaq } from "@/lib/mart-api/faq";
import { FALLBACK_NEWSLETTER, listPublicNewsletter } from "@/lib/mart-api/newsletter";
import { featuredForStore, listPublicFeatured } from "@/lib/mart-api/featured";
import { FALLBACK_REVIEWS, listPublicReviews } from "@/lib/mart-api/reviews";
import { listPublicShowcase, showcaseForStore } from "@/lib/mart-api/showcase";
import { FALLBACK_TRUST, listPublicTrustBenefits } from "@/lib/mart-api/trust";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: DEFAULT_TITLE },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export default async function HomePage() {
  const [catalog, hero, trust, categories, featured, showcase, reviews, faq, newsletter] =
    await Promise.all([
      loadStoreCatalog(),
      listPublicHeroSlides(),
      listPublicTrustBenefits(),
      listPublicCategories(),
      listPublicFeatured(),
      listPublicShowcase(),
      listPublicReviews(),
      listPublicFaq(),
      listPublicNewsletter(),
    ]);
  const products = catalog.products;
  const featuredSection = featuredForStore(featured, products, catalog.unavailable);
  const showcaseSection = showcaseForStore(showcase, products, catalog.unavailable);
  const faqSection = faq ?? FALLBACK_FAQ;
  const faqJsonLd =
    faqSection.items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqSection.items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <main className="force-light bg-[#f5f6f8] text-neutral-950">
        {catalog.unavailable ? (
          <Container className="px-4 pt-4 sm:px-6 lg:px-8">
            <p
              role="alert"
              className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700"
            >
              প্রোডাক্ট এখন লোড করা যায়নি। একটু পরে আবার দেখুন।
            </p>
          </Container>
        ) : null}
        <HeroSection
          slides={hero ?? []}
          categories={categories ?? FALLBACK_CATEGORIES}
        />
        <HomeTrustStrip items={trust ?? FALLBACK_TRUST} />
        {featuredSection ? (
          <FeaturedProductsSection section={featuredSection} products={products} />
        ) : null}
        {showcaseSection ? (
          <CategoryShowcaseSection section={showcaseSection} products={products} />
        ) : null}
        <TestimonialsSection section={reviews ?? FALLBACK_REVIEWS} />
        <FaqSection section={faqSection} />
        <NewsletterSection section={newsletter ?? FALLBACK_NEWSLETTER} />
      </main>
    </>
  );
}
