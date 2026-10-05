import type { Metadata } from "next";
import Link from "next/link";

import { CategoryShowcaseSection } from "./_components/home/brands-categories-section";
import { FaqSection } from "./_components/home/faq-section";
import { CategoriesStripSection } from "./_components/home/categories-strip-section";
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
import { fallbackFeatured, listPublicFeatured } from "@/lib/mart-api/featured";
import { FALLBACK_REVIEWS, listPublicReviews } from "@/lib/mart-api/reviews";
import { fallbackShowcase, listPublicShowcase } from "@/lib/mart-api/showcase";
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
  const featuredSection = featured ?? (catalog.unavailable ? null : fallbackFeatured(products));
  const showcaseSection = showcase ?? (catalog.unavailable ? null : fallbackShowcase(products));
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
        {hero && hero.length > 0 ? (
          <HeroSection slides={hero} />
        ) : (
          <section className="bg-[#f5f6f8] px-4 pt-4 pb-2 sm:px-6 lg:px-8" aria-label="ইমপ্লেসিয়া মার্ট">
            <Container>
              <div className="rounded-2xl bg-[#071820] px-5 py-8 text-white sm:px-8 sm:py-10">
                <p className="text-xs font-semibold tracking-[0.16em] text-[#8ed4c1] uppercase">
                  Implesia Mart
                </p>
                <h1 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                  ট্রেন্ডিং গ্যাজেট ও হাতে তৈরি ড্রেস
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
                  ক্যাশ অন ডেলিভারি। দাম ও স্টক চেকআউটে নিশ্চিত হয়।
                </p>
                <Link
                  href="/products"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#2bc0b5] px-5 text-sm font-semibold text-[#042422]"
                >
                  সব প্রোডাক্ট
                </Link>
              </div>
            </Container>
          </section>
        )}
        <HomeTrustStrip items={trust ?? FALLBACK_TRUST} />
        <CategoriesStripSection section={categories ?? FALLBACK_CATEGORIES} />
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
