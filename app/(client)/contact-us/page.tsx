import type { Metadata } from "next";

import { Container } from "../_components/common/container";
import { ContactDetails } from "./_components/contact-details";
import { ContactFaq } from "./_components/contact-faq";
import { ContactForm } from "./_components/contact-form";
import { ContactHero } from "./_components/contact-hero";
import { ContactSupport } from "./_components/contact-support";

export const metadata: Metadata = {
  title: "যোগাযোগ করুন",
  description:
    "ইমপ্লেসিয়া মার্টের সাথে যোগাযোগ করুন — কল, হোয়াটসঅ্যাপ, ইমেইল বা মেসেজ ফর্মের মাধ্যমে অর্ডার, ডেলিভারি বা প্রোডাক্ট নিয়ে সাহায্য পান।",
  alternates: { canonical: "/contact-us" },
};

export default function ContactUsPage() {
  return (
    <main>
      <ContactHero />

      <section className="w-full py-10 sm:py-14 lg:py-xl">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
            <ContactForm />
            <ContactDetails />
          </div>
        </Container>
      </section>

      <ContactSupport />
      <ContactFaq />
    </main>
  );
}
