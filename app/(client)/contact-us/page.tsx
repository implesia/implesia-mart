import type { Metadata } from "next";

import { parseSchedule } from "@/lib/contact/contact-rules";
import { listPublicContactDetails } from "@/lib/mart-api/contact-details";
import { listPublicContactFaq } from "@/lib/mart-api/contact-faq";
import { listPublicContactForm } from "@/lib/mart-api/contact-form";
import { FALLBACK_CONTACT_HERO, listPublicContactHero } from "@/lib/mart-api/contact-hero";
import { listPublicContactSupport } from "@/lib/mart-api/contact-support";
import { cn } from "@/lib/utils";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { ContactCta } from "./_components/contact-cta";
import { ContactDetails, contactChannels } from "./_components/contact-details";
import { ContactFaq } from "./_components/contact-faq";
import { ContactForm } from "./_components/contact-form";
import { ContactHero } from "./_components/contact-hero";
import { OpenBadge } from "./_components/contact-open-badge";
import { ContactSupport } from "./_components/contact-support";
import { ContactToaster } from "./_components/contact-toast";

// Render per request: the Workers KV fetch/ISR cache hit its daily write limit and
// kept serving stale CMS data (old image URLs). CMS reads go straight to the API.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "যোগাযোগ",
  description:
    "ইমপ্লেসিয়া মার্ট — কল, হোয়াটসঅ্যাপ বা ইমেইলে অর্ডার, ডেলিভারি ও প্রোডাক্ট নিয়ে যোগাযোগ করুন।",
  alternates: { canonical: "/contact-us" },
};

export default async function ContactUsPage() {
  const [heroData, form, details, support, faq] = await Promise.all([
    listPublicContactHero(),
    listPublicContactForm(),
    listPublicContactDetails(),
    listPublicContactSupport(),
    listPublicContactFaq(),
  ]);
  const hero = heroData ?? FALLBACK_CONTACT_HERO;
  const hours = support?.isActive ? support.hours.filter((h) => h.isActive && h.label.trim()) : [];
  const hasSchedule = parseSchedule(hours) !== null;
  const overlap = hero.isActive && contactChannels(details).length > 0;
  const showForm = !!form?.isActive;
  const showSupport = !!support?.isActive && (hours.length > 0 || support.quickLinks.some((l) => l.isActive));
  const chat = hero.isActive ? hero.primaryCta : undefined;

  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <ContactToaster />
      <ContactHero
        hero={hero}
        overlap={overlap}
        breadcrumb={
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "যোগাযোগ" },
            ]}
          />
        }
        status={hasSchedule ? <OpenBadge rows={hours} /> : undefined}
      />
      <ContactDetails details={details} overlap={overlap} />

      {showForm || showSupport ? (
        <section className="w-full pt-10 sm:pt-14 lg:pt-16">
          <Container className="px-4 sm:px-6 lg:px-8">
            <div
              className={cn(
                "grid grid-cols-1 items-start gap-6 lg:gap-8",
                showForm && showSupport && "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]",
                showForm !== showSupport && "mx-auto max-w-3xl",
              )}
            >
              {showForm ? (
                <ContactForm form={form} whatsappHref={hero.isActive ? hero.primaryCta.href : ""} />
              ) : null}
              {showSupport ? <ContactSupport support={support} className="lg:sticky lg:top-24" /> : null}
            </div>
          </Container>
        </section>
      ) : null}

      {faq?.isActive && faq.items.some((i) => i.isActive && i.question.trim()) ? (
        <div className="pt-12 sm:pt-16 lg:pt-20">
          <ContactFaq faq={faq} />
        </div>
      ) : null}
      <ContactCta chat={chat} />
    </main>
  );
}
