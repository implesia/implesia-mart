import type { Metadata } from "next";

import {
  FALLBACK_CONTACT_HERO,
  listPublicContactHero,
} from "@/lib/mart-api/contact-hero";
import { listPublicContactForm } from "@/lib/mart-api/contact-form";
import { listPublicContactDetails } from "@/lib/mart-api/contact-details";
import { listPublicContactSupport } from "@/lib/mart-api/contact-support";
import { listPublicContactFaq } from "@/lib/mart-api/contact-faq";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { ContactDetails } from "./_components/contact-details";
import { ContactFaq } from "./_components/contact-faq";
import { ContactForm } from "./_components/contact-form";
import { ContactHero } from "./_components/contact-hero";
import { ContactSupport } from "./_components/contact-support";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "যোগাযোগ",
  description:
    "ইমপ্লেসিয়া মার্ট — কল, হোয়াটসঅ্যাপ বা ইমেইলে অর্ডার, ডেলিভারি ও প্রোডাক্ট নিয়ে যোগাযোগ করুন।",
  alternates: { canonical: "/contact-us" },
};

export default async function ContactUsPage() {
  const [hero, form, details, support, faq] = await Promise.all([
    listPublicContactHero(),
    listPublicContactForm(),
    listPublicContactDetails(),
    listPublicContactSupport(),
    listPublicContactFaq(),
  ]);
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "যোগাযোগ" },
            ]}
          />
        </div>
      </Container>
      <ContactHero hero={hero ?? FALLBACK_CONTACT_HERO} />

      <section className="w-full bg-[#f5f6f8] py-6 sm:py-8">
        <Container className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <ContactForm
              form={form}
              whatsappHref={hero?.isActive ? hero.primaryCta.href : ""}
            />
            <ContactDetails details={details} />
          </div>
        </Container>
      </section>

      <ContactSupport support={support} />
      <ContactFaq faq={faq} />
    </main>
  );
}
