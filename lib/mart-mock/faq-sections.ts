import { WHATSAPP_HREF } from "@/app/(client)/_data/contact/contact";
import { faqsCopy } from "@/app/(client)/_data/faqs/faqs";

import { MOCK_EVENT } from "./store";

const KEY = "implesia.admin.faq-sections.v1";

export type FaqTrendingItem = { id: string; label: string; isActive?: boolean };
export type FaqCategoryItem = {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
};
export type FaqQuestion = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  isActive?: boolean;
};

export type FaqHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  searchLabel: string;
  clearLabel: string;
  trendingLabel: string;
  trending: FaqTrendingItem[];
  isActive?: boolean;
};

export type FaqCategoriesContent = {
  title: string;
  subtitle: string;
  allLabel: string;
  allIcon: string;
  navLabel: string;
  items: FaqCategoryItem[];
  isActive?: boolean;
};

export type FaqListingContent = {
  countSuffix: string;
  emptyTitle: string;
  emptyBody: string;
  isActive?: boolean;
};

export type FaqCalloutContent = {
  eyebrow: string;
  body: string;
  isActive?: boolean;
};

export type FaqHelpContent = {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  isActive?: boolean;
};

export type FaqSections = {
  hero: FaqHeroContent;
  categories: FaqCategoriesContent;
  listing: FaqListingContent;
  callout: FaqCalloutContent;
  items: FaqQuestion[];
  help: FaqHelpContent;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(MOCK_EVENT));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function seedFaqSections(): FaqSections {
  return {
    hero: {
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
      })),
    },
    categories: {
      title: faqsCopy.sidebar.title,
      subtitle: faqsCopy.sidebar.subtitle,
      allLabel: faqsCopy.sidebar.allLabel,
      allIcon: "grid_view",
      navLabel: "FAQ ক্যাটাগরি",
      items: faqsCopy.categories.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
      })),
    },
    listing: {
      countSuffix: "টি প্রশ্ন",
      emptyTitle: faqsCopy.empty.title,
      emptyBody: faqsCopy.empty.body,
    },
    callout: {
      eyebrow: faqsCopy.callout.eyebrow,
      body: faqsCopy.callout.body,
    },
    items: faqsCopy.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      question: item.question,
      answer: item.answer,
    })),
    help: {
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

export function readFaqSections(): FaqSections {
  const seed = seedFaqSections();
  const stored = readJson<Partial<FaqSections>>(KEY);
  if (!stored) return seed;
  return {
    hero: {
      ...seed.hero,
      ...stored.hero,
      trending: stored.hero?.trending ?? seed.hero.trending,
    },
    categories: {
      ...seed.categories,
      ...stored.categories,
      items: stored.categories?.items ?? seed.categories.items,
    },
    listing: { ...seed.listing, ...stored.listing },
    callout: { ...seed.callout, ...stored.callout },
    items: stored.items ?? seed.items,
    help: { ...seed.help, ...stored.help },
  };
}

export function saveFaqSections(sections: FaqSections) {
  writeJson(KEY, sections);
}

export function blankFaqTrending(): FaqTrendingItem {
  return { id: newId("trend"), label: "", isActive: true };
}

export function blankFaqCategory(): FaqCategoryItem {
  return { id: newId("cat"), label: "", icon: "help", isActive: true };
}

export function blankFaqQuestion(categoryId: string): FaqQuestion {
  return {
    id: newId("faq"),
    categoryId,
    question: "",
    answer: "",
    isActive: true,
  };
}

export function faqCategoryLabel(sections: FaqSections, categoryId: string) {
  return sections.categories.items.find((item) => item.id === categoryId)?.label ?? "";
}

export function moveList<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}
