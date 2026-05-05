import { ContactFaq } from "./_components/contact-faq";
import { ContactForm } from "./_components/contact-form";
import { ContactHero } from "./_components/contact-hero";
import { ContactDetails } from "./_components/contact-details";
import { ContactMap } from "./_components/contact-map";

export default function ContactUsPage() {
  return (
    <main className="pt-32">
      <ContactHero />

      <section className="py-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-xl px-6 lg:grid-cols-2 lg:px-8">
          <ContactForm />
          <ContactDetails />
        </div>
      </section>

      <ContactMap />
      <ContactFaq />
    </main>
  );
}
