import type { Metadata } from "next";

import { getPublicDeliveryRates } from "@/lib/mart-api/delivery";
import { listPublicFaqCallout } from "@/lib/mart-api/faq-callout";
import { listPublicFaqCategories } from "@/lib/mart-api/faq-categories";
import { resolveFaqPage } from "@/lib/mart-api/faq-fallback";
import { listPublicFaqHelp } from "@/lib/mart-api/faq-help";
import { listPublicFaqHero } from "@/lib/mart-api/faq-hero";
import { listPublicFaqItems } from "@/lib/mart-api/faq-items";
import { listPublicFaqListing } from "@/lib/mart-api/faq-listing";

import { Container } from "../_components/common/container";
import { ProductBreadcrumbs } from "../products/_components/product-breadcrumbs";
import { FaqsView } from "./_components/faqs-view";

// Render per request: the Workers KV fetch/ISR cache hit its daily write limit and
// kept serving stale CMS data (old image URLs). CMS reads go straight to the API.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "প্রশ্নোত্তর",
  description:
    "ইমপ্লেসিয়া মার্ট — অর্ডার, অর্ডার স্ট্যাটাস, ক্যাশ অন ডেলিভারি, ডেলিভারি চার্জ ও ৩ দিনের রিটার্ন নিয়ে সাধারণ প্রশ্নের উত্তর।",
  alternates: { canonical: "/faqs" },
};

export default async function FaqsPage() {
  const [hero, categories, listing, callout, items, help, rates] = await Promise.all([
    listPublicFaqHero(),
    listPublicFaqCategories(),
    listPublicFaqListing(),
    listPublicFaqCallout(),
    listPublicFaqItems(),
    listPublicFaqHelp(),
    getPublicDeliveryRates().catch(() => null),
  ]);
  const page = resolveFaqPage({ hero, categories, listing, callout, items, help }, rates);
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
        hero={page.hero}
        categories={page.categories}
        listing={page.listing}
        callout={page.callout}
        items={page.items}
        help={page.help}
      />
    </main>
  );
}
