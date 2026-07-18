import { FaqsContent } from "./_components/faqs-content";
import { FaqsHero } from "./_components/faqs-hero";
import { FaqsSidebar } from "./_components/faqs-sidebar";

export default function FaqsPage() {
  return (
    <main className="bg-background text-on-surface">
      <FaqsHero />

      <section className="mx-auto flex max-w-7xl gap-xl px-6 py-xl md:px-12 lg:px-12">
        <FaqsSidebar />
        <FaqsContent />
      </section>
    </main>
  );
}
