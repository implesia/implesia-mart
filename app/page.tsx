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
import { listStoreProducts } from "@/lib/mart-api/catalog";
import { listPublicHeroSlides } from "@/lib/mart-api/hero";
import { FALLBACK_CATEGORIES, listPublicCategories } from "@/lib/mart-api/categories";
import { FALLBACK_FAQ, listPublicFaq } from "@/lib/mart-api/faq";
import { FALLBACK_NEWSLETTER, listPublicNewsletter } from "@/lib/mart-api/newsletter";
import { fallbackFeatured, listPublicFeatured } from "@/lib/mart-api/featured";
import { FALLBACK_REVIEWS, listPublicReviews } from "@/lib/mart-api/reviews";
import { fallbackShowcase, listPublicShowcase } from "@/lib/mart-api/showcase";
import { FALLBACK_TRUST, listPublicTrustBenefits } from "@/lib/mart-api/trust";
import { heroSlides } from "./(client)/_data/home/home";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "@/lib/seo";

export const revalidate = 60;

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

export default async function HomePage() {
  const [products, hero, trust, categories, featured, showcase, reviews, faq, newsletter] =
    await Promise.all([
      listStoreProducts(),
      listPublicHeroSlides(),
      listPublicTrustBenefits(),
      listPublicCategories(),
      listPublicFeatured(),
      listPublicShowcase(),
      listPublicReviews(),
      listPublicFaq(),
      listPublicNewsletter(),
    ]);
  const faqSection = faq ?? FALLBACK_FAQ;
  const faqJsonLd = {
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
  };
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <main className="force-light bg-[#f5f6f8] text-neutral-950">
        <HeroSection slides={hero ?? heroSlides} />
        <HomeTrustStrip items={trust ?? FALLBACK_TRUST} />
        <CategoriesStripSection section={categories ?? FALLBACK_CATEGORIES} />
        <FeaturedProductsSection section={featured ?? fallbackFeatured(products)} products={products} />
        <CategoryShowcaseSection section={showcase ?? fallbackShowcase(products)} products={products} />
        <TestimonialsSection section={reviews ?? FALLBACK_REVIEWS} />
        <FaqSection section={faqSection} />
        <NewsletterSection section={newsletter ?? FALLBACK_NEWSLETTER} />
      </main>
    </>
  );
}
