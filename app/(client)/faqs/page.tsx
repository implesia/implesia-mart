import type { Metadata } from "next";

import { listPublicFaqCallout } from "@/lib/mart-api/faq-callout";
import { listPublicFaqCategories } from "@/lib/mart-api/faq-categories";
import { listPublicFaqHelp } from "@/lib/mart-api/faq-help";
import { listPublicFaqHero } from "@/lib/mart-api/faq-hero";
import { listPublicFaqItems } from "@/lib/mart-api/faq-items";
import { listPublicFaqListing } from "@/lib/mart-api/faq-listing";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { FaqsView } from "./_components/faqs-view";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "প্রশ্নোত্তর",
  description:
    "ইমপ্লেসিয়া মার্ট — অর্ডার, ডেলিভারি, ক্যাশ অন ডেলিভারি, রিটার্ন ও গর্জিয়াস ড্রেস নিয়ে সাধারণ প্রশ্নের উত্তর।",
  alternates: { canonical: "/faqs" },
};

export default async function FaqsPage() {
  const [hero, categories, listing, callout, items, help] = await Promise.all([
    listPublicFaqHero(),
    listPublicFaqCategories(),
    listPublicFaqListing(),
    listPublicFaqCallout(),
    listPublicFaqItems(),
    listPublicFaqHelp(),
  ]);
  return (
    <main className="force-light w-full overflow-x-hidden bg-[#f5f6f8] text-neutral-950">
      <Container className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full pt-3 sm:pt-4 lg:pt-5">
          <ProductBreadcrumbs
            items={[
              { label: "হোম", href: "/" },
              { label: "প্রশ্নোত্তর" },
            ]}
          />
        </div>
      </Container>
      <FaqsView
        hero={hero}
        categories={categories}
        listing={listing}
        callout={callout}
        items={items}
        help={help}
      />
    </main>
  );
}
