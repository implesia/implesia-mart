
import { BestSellingSection } from "./(client)/_components/home/best-selling-section";
import { FaqSection } from "./(client)/_components/home/faq-section";
import { FlashSaleSection } from "./(client)/_components/home/flash-sale-section";
import { HeroSection } from "./(client)/_components/home/hero-section";
import { NewsletterSection } from "./(client)/_components/home/newsletter-section";
import { OrganicHighlightSection } from "./(client)/_components/home/organic-highlight-section";
import { TestimonialsSection } from "./(client)/_components/home/testimonials-section";

export default function HomePage() {
  return (
    <>
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
