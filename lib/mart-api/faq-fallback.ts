import { WHATSAPP_HREF } from "@/app/(client)/_data/contact/contact";
import { deliveryChargeAnswer, faqsCopy } from "@/app/(client)/_data/faqs/faqs";
import type { DeliveryRates } from "@/lib/mart-api/delivery";
import type { FaqCallout } from "@/lib/mart-api/faq-callout";
import type { FaqCategories } from "@/lib/mart-api/faq-categories";
import type { FaqHelp } from "@/lib/mart-api/faq-help";
import type { FaqHero } from "@/lib/mart-api/faq-hero";
import type { FaqItem } from "@/lib/mart-api/faq-items";
import type { FaqListing } from "@/lib/mart-api/faq-listing";

export type FaqPageContent = {
  hero: FaqHero | null;
  categories: FaqCategories | null;
  listing: FaqListing | null;
  callout: FaqCallout | null;
  items: FaqItem[];
  help: FaqHelp | null;
};

/** The bundled FAQ page, with delivery charges filled in from the live rates when known. */
export function fallbackFaqPage(rates: DeliveryRates | null): FaqPageContent {
  return {
    hero: {
      isActive: true,
      eyebrow: faqsCopy.hero.eyebrow,
      title: faqsCopy.hero.title,
      subtitle: faqsCopy.hero.subtitle,
      placeholder: faqsCopy.hero.placeholder,
      searchLabel: "প্রশ্ন খুঁজুন",
      clearLabel: "সার্চ মুছুন",
      trendingLabel: faqsCopy.hero.trendingLabel,
      trending: faqsCopy.hero.trending.map((label, index) => ({
        id: `trend-${index + 1}`,
        label,
        isActive: true,
      })),
    },
    categories: {
      isActive: true,
      title: faqsCopy.sidebar.title,
      subtitle: faqsCopy.sidebar.subtitle,
      allLabel: faqsCopy.sidebar.allLabel,
      allIcon: "grid_view",
      navLabel: "প্রশ্নের ক্যাটাগরি",
      items: faqsCopy.categories.map((item) => ({ ...item, isActive: true })),
    },
    listing: {
      isActive: true,
      countSuffix: "টি প্রশ্ন",
      emptyTitle: faqsCopy.empty.title,
      emptyBody: faqsCopy.empty.body,
    },
    callout: { isActive: true, eyebrow: faqsCopy.callout.eyebrow, body: faqsCopy.callout.body },
    items: faqsCopy.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      question: item.question,
      answer: item.id === "delivery-charge" ? deliveryChargeAnswer(rates) : item.answer,
      isActive: true,
      ...("link" in item && item.link ? { link: { ...item.link } } : {}),
    })),
    help: {
      isActive: true,
      title: faqsCopy.helpCta.title,
      subtitle: faqsCopy.helpCta.subtitle,
      email: faqsCopy.helpCta.email,
      phone: faqsCopy.helpCta.phone,
      primaryLabel: faqsCopy.helpCta.button,
      primaryHref: "/contact-us",
      secondaryLabel: faqsCopy.helpCta.whatsapp,
      secondaryHref: WHATSAPP_HREF,
    },
  };
}

/**
 * Use the CMS page once it has at least one published question; until then
 * (empty CMS, or the API unreachable) show the bundled page as one coherent set,
 * so categories and questions always match.
 */
export function resolveFaqPage(cms: FaqPageContent, rates: DeliveryRates | null): FaqPageContent {
  const published = cms.items.some((item) => item.isActive !== false && item.question.trim() && item.answer.trim());
  return published ? cms : fallbackFaqPage(rates);
}
