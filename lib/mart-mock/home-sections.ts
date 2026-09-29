import {
  bestSellingProducts,
  faqSections,
  testimonials,
} from "@/app/(client)/_data/home/home";
import {
  categoryLabels,
  products,
  productsHref,
  type Product,
  type ProductCategoryId,
} from "@/app/(client)/_data/products/products";

import { MOCK_EVENT } from "./store";

const KEY = "implesia.admin.home-sections.v1";

export type TrustItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
};

export type CategoryTile = {
  id: string;
  label: string;
  imageSrc: string;
  href: string;
};

export type CategoriesSection = {
  heading: string;
  tiles: CategoryTile[];
};

export type FeaturedSection = {
  heading: string;
  viewAllLabel: string;
  viewAllHref: string;
  slugs: string[];
};

export type ShowcaseRow = {
  id: ProductCategoryId;
  heading: string;
  href: string;
  slugs: string[];
};

export type ReviewItem = {
  id: string;
  imageSrc: string;
  imageAlt: string;
  product: string;
  channel: "WhatsApp" | "Messenger";
};

export type ReviewsSection = {
  kicker: string;
  title: string;
  subtitle: string;
  items: ReviewItem[];
};

export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export type FaqSectionContent = {
  kicker: string;
  title: string;
  subtitle: string;
  moreLabel: string;
  moreHref: string;
  items: FaqItem[];
};

export type NewsletterPerk = {
  id: string;
  icon: string;
  label: string;
};

export type NewsletterContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  cta: string;
  success: string;
  perks: NewsletterPerk[];
};

export type HomeSections = {
  trust: TrustItem[];
  categories: CategoriesSection;
  featured: FeaturedSection;
  showcase: ShowcaseRow[];
  reviews: ReviewsSection;
  faq: FaqSectionContent;
  newsletter: NewsletterContent;
};

export type CatalogChoice = {
  slug: string;
  title: string;
  imageSrc: string;
  price: number;
  categoryId: ProductCategoryId;
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
  return `${prefix}-${Date.now().toString(36)}`;
}

function availableSlugs(categoryId: ProductCategoryId) {
  return products
    .filter((item) => item.categoryId === categoryId && item.status === "available")
    .map((item) => item.slug);
}

export function seedHomeSections(): HomeSections {
  const featuredSlugs = bestSellingProducts
    .filter((item) => item.status === "available")
    .slice(0, 4)
    .map((item) => item.slug);

  return {
    trust: [
      { id: "cod", icon: "payments", label: "ক্যাশ অন ডেলিভারি", href: "/shipping-returns" },
      { id: "delivery", icon: "local_shipping", label: "সারাদেশে ডেলিভারি", href: "/shipping-returns" },
      { id: "returns", icon: "assignment_return", label: "৩ দিন ইজি রিটার্ন", href: "/shipping-returns" },
    ],
    categories: {
      heading: "ক্যাটাগরি",
      tiles: [
        {
          id: "gadgets",
          label: categoryLabels.gadgets,
          imageSrc: "/images/products/lamp/lamp-5.jpg",
          href: productsHref({ category: "gadgets" }),
        },
        {
          id: "fashion",
          label: categoryLabels.fashion,
          imageSrc: "/images/products/baby-products/wedding-dress.jpeg",
          href: productsHref({ category: "fashion" }),
        },
      ],
    },
    featured: {
      heading: "ফিচার্ড প্রোডাক্ট",
      viewAllLabel: "সব দেখুন",
      viewAllHref: productsHref({ view: "featured" }),
      slugs: featuredSlugs,
    },
    showcase: [
      {
        id: "gadgets",
        heading: categoryLabels.gadgets,
        href: productsHref({ category: "gadgets" }),
        slugs: availableSlugs("gadgets"),
      },
      {
        id: "fashion",
        heading: categoryLabels.fashion,
        href: productsHref({ category: "fashion" }),
        slugs: availableSlugs("fashion"),
      },
    ],
    reviews: {
      kicker: "রিভিউ",
      title: "কাস্টমাররা যা বলছেন",
      subtitle: "হোয়াটসঅ্যাপ ও মেসেঞ্জারের রিভিউ স্ক্রিনশট। ছবিতে ক্লিক করলে পুরো কথোপকথন খোলে।",
      items: testimonials.map((item) => ({
        id: item.id,
        imageSrc: item.imageSrc,
        imageAlt: item.imageAlt,
        product: item.product,
        channel: item.channel,
      })),
    },
    faq: {
      kicker: "জিজ্ঞাসা ও উত্তর",
      title: "প্রায়শই জিজ্ঞাসিত প্রশ্ন",
      subtitle: "অর্ডার, পেমেন্ট, ডেলিভারি ও রিটার্ন নিয়ে সাধারণ প্রশ্নের দ্রুত উত্তর।",
      moreLabel: "আরও প্রশ্ন দেখুন",
      moreHref: "/faqs",
      items: faqSections.map((item, index) => ({
        id: `faq-${index + 1}`,
        category: item.category,
        question: item.question,
        answer: item.answer,
      })),
    },
    newsletter: {
      eyebrow: "অফার ও আপডেট",
      title: "নতুন অফার মিস করবেন না",
      subtitle: "ইমেইলে পান ফ্ল্যাশ সেল, নতুন গ্যাজেট লঞ্চ আর বিশেষ ছাড়ের খবর।",
      placeholder: "আপনার ইমেইল লিখুন",
      cta: "সাবস্ক্রাইব",
      success: "ধন্যবাদ! শীঘ্রই আপডেট পাবেন।",
      perks: [
        { id: "offers", icon: "local_offer", label: "ফ্ল্যাশ অফার আপডেট" },
        { id: "gadgets", icon: "campaign", label: "নতুন গ্যাজেট আগে জানুন" },
        { id: "spam", icon: "shield", label: "স্প্যাম নেই" },
      ],
    },
  };
}

export function readHomeSections(): HomeSections {
  const seed = seedHomeSections();
  const stored = readJson<Partial<HomeSections>>(KEY);
  if (!stored) return seed;
  return {
    trust: stored.trust ?? seed.trust,
    categories: {
      heading: stored.categories?.heading ?? seed.categories.heading,
      tiles: stored.categories?.tiles ?? seed.categories.tiles,
    },
    featured: {
      ...seed.featured,
      ...stored.featured,
      slugs: stored.featured?.slugs ?? seed.featured.slugs,
    },
    showcase: stored.showcase ?? seed.showcase,
    reviews: {
      ...seed.reviews,
      ...stored.reviews,
      items: stored.reviews?.items ?? seed.reviews.items,
    },
    faq: {
      ...seed.faq,
      ...stored.faq,
      items: stored.faq?.items ?? seed.faq.items,
    },
    newsletter: {
      ...seed.newsletter,
      ...stored.newsletter,
      perks: stored.newsletter?.perks ?? seed.newsletter.perks,
    },
  };
}

export function saveHomeSections(next: HomeSections) {
  writeJson(KEY, next);
}

export function catalogChoices(): CatalogChoice[] {
  return products.map((product) => ({
    slug: product.slug,
    title: product.title,
    imageSrc: product.imageSrc,
    price: product.price,
    categoryId: product.categoryId,
  }));
}

export function productsForSlugs(slugs: string[]): Product[] {
  return slugs.flatMap((slug) => {
    const product = products.find((item) => item.slug === slug);
    return product ? [product] : [];
  });
}

export function blankTrustItem(): TrustItem {
  return { id: newId("trust"), icon: "verified", label: "", href: "/shipping-returns" };
}

export function blankCategoryTile(): CategoryTile {
  return { id: newId("tile"), label: "", imageSrc: "", href: "/products" };
}

export function blankReview(): ReviewItem {
  return {
    id: newId("review"),
    imageSrc: "",
    imageAlt: "",
    product: "",
    channel: "WhatsApp",
  };
}

export function blankFaq(): FaqItem {
  return { id: newId("faq"), category: "", question: "", answer: "" };
}

export function blankPerk(): NewsletterPerk {
  return { id: newId("perk"), icon: "local_offer", label: "" };
}
