import { getProductMedia, type ProductMediaId } from "./product-media";

export type ProductBadge = "New" | "Best Seller" | "Limited";
export type ProductStatus = "available" | "coming-soon";
export type ProductCategoryId = "gadgets" | "fashion";

export type Product = {
  id: ProductMediaId;
  slug: string;
  title: string;
  subtitle: string;
  price: number;
  compareAtPrice?: number;
  unitLabel?: string;
  imageSrc: string;
  imageAlt: string;
  badge?: ProductBadge;
  status: ProductStatus;
  categoryId: ProductCategoryId;
};

export const categoryLabels: Record<ProductCategoryId, string> = {
  gadgets: "ট্রেন্ডিং গ্যাজেট",
  fashion: "গর্জিয়াস ড্রেস",
};

/**
 * Temporary on-brand placeholder (kept for non-product surfaces / avatars).
 */
export function placeholderImage(text: string, bg = "2bc0b5", fg = "ffffff") {
  return `https://placehold.co/900x900/${bg}/${fg}.png?text=${encodeURIComponent(text)}&font=roboto`;
}

function withMedia(
  id: ProductMediaId,
  rest: Omit<Product, "id" | "imageSrc" | "imageAlt"> & { imageAlt: string },
): Product {
  const media = getProductMedia(id);
  return {
    id,
    imageSrc: media.primary,
    ...rest,
  };
}

export const products: Product[] = [
  withMedia("sunset-lamp", {
    slug: "sunset-rainbow-projection-lamp",
    title: "সানসেট প্রজেকশন ল্যাম্প",
    subtitle: "রেইনবো লাইট | রুম ডেকোর গ্যাজেট",
    price: 999,
    compareAtPrice: 1499,
    imageAlt: "সানসেট প্রজেকশন ল্যাম্প",
    badge: "Best Seller",
    status: "available",
    categoryId: "gadgets",
  }),
  withMedia("ai-tracking-holder", {
    slug: "ai-face-tracking-phone-holder",
    title: "এআই ফেস ট্র্যাকিং ফোন হোল্ডার",
    subtitle: "সেলফি স্ট্যান্ড | স্মার্ট ট্রাইপড",
    price: 1999,
    compareAtPrice: 2499,
    imageAlt: "এআই ফেস ট্র্যাকিং সেলফি স্ট্যান্ড",
    badge: "New",
    status: "available",
    categoryId: "gadgets",
  }),
  withMedia("tws-earbuds", {
    slug: "tws-wireless-earbuds",
    title: "TWS ওয়্যারলেস ইয়ারবাড",
    subtitle: "প্রিমিয়াম সাউন্ড | লং ব্যাটারি লাইফ",
    price: 1299,
    compareAtPrice: 1799,
    imageAlt: "TWS ওয়্যারলেস ইয়ারবাড",
    status: "coming-soon",
    categoryId: "gadgets",
  }),
  withMedia("neckband", {
    slug: "bluetooth-neckband-earphone",
    title: "ব্লুটুথ নেকব্যান্ড ইয়ারফোন",
    subtitle: "স্পোর্টস ফ্রেন্ডলি | ক্লিয়ার কলিং",
    price: 799,
    compareAtPrice: 1199,
    imageAlt: "ব্লুটুথ নেকব্যান্ড ইয়ারফোন",
    status: "coming-soon",
    categoryId: "gadgets",
  }),
  withMedia("car-holder", {
    slug: "magnetic-car-phone-holder",
    title: "ম্যাগনেটিক কার ফোন হোল্ডার",
    subtitle: "ম্যাগনেটিক গ্রিপ | ৩৬০° রোটেশন",
    price: 499,
    compareAtPrice: 799,
    imageAlt: "ম্যাগনেটিক কার ফোন হোল্ডার",
    status: "coming-soon",
    categoryId: "gadgets",
  }),
  withMedia("charging-cable", {
    slug: "fast-charging-3in1-cable",
    title: "ফাস্ট চার্জিং ৩-ইন-১ ক্যাবল",
    subtitle: "ফাস্ট চার্জিং | মাল্টি-ডিভাইস সাপোর্ট",
    price: 399,
    compareAtPrice: 699,
    imageAlt: "ফাস্ট চার্জিং ৩-ইন-১ ক্যাবল",
    status: "coming-soon",
    categoryId: "gadgets",
  }),
  withMedia("power-bank", {
    slug: "slim-power-bank-10000mah",
    title: "স্লিম পাওয়ার ব্যাংক ১০,০০০mAh",
    subtitle: "স্লিম ডিজাইন | ফাস্ট চার্জিং সাপোর্ট",
    price: 1299,
    compareAtPrice: 1799,
    imageAlt: "স্লিম পাওয়ার ব্যাংক ১০,০০০mAh",
    status: "coming-soon",
    categoryId: "gadgets",
  }),
  withMedia("mini-printer", {
    slug: "mini-thermal-printer",
    title: "মিনি থার্মাল প্রিন্টার",
    subtitle: "ইঙ্কলেস প্রিন্টিং | নোট ও স্টাডির জন্য পারফেক্ট",
    price: 2999,
    compareAtPrice: 3999,
    imageAlt: "মিনি থার্মাল প্রিন্টার",
    status: "coming-soon",
    categoryId: "gadgets",
  }),
  withMedia("smart-ring", {
    slug: "smart-fitness-ring",
    title: "স্মার্ট রিং (ফিটনেস ট্র্যাকার)",
    subtitle: "হার্ট রেট ও স্লিপ ট্র্যাকিং | মিনিমাল ডিজাইন",
    price: 2299,
    compareAtPrice: 2999,
    imageAlt: "স্মার্ট রিং",
    status: "coming-soon",
    categoryId: "gadgets",
  }),
  withMedia("galaxy-humidifier", {
    slug: "galaxy-projector-humidifier",
    title: "গ্যালাক্সি প্রজেক্টর হিউমিডিফায়ার",
    subtitle: "নাইট লাইট + এয়ার হিউমিডিফায়ার, ২-ইন-১",
    price: 1499,
    compareAtPrice: 1999,
    imageAlt: "গ্যালাক্সি প্রজেক্টর হিউমিডিফায়ার",
    status: "coming-soon",
    categoryId: "gadgets",
  }),
  withMedia("custom-baby-frock", {
    slug: "custom-baby-party-frock",
    title: "কাস্টম বেবি পার্টি ফ্রক",
    subtitle: "হাতে তৈরি | কাস্টম ডিজাইন ও কালার",
    price: 1450,
    unitLabel: "শুরু",
    imageAlt: "হাতে তৈরি বেবি পার্টি ফ্রক",
    badge: "New",
    status: "available",
    categoryId: "fashion",
  }),
  withMedia("womens-gorgeous-gown", {
    slug: "custom-gorgeous-womens-gown",
    title: "গর্জিয়াস উইমেন্স গাউন",
    subtitle: "হাতে তৈরি | কাস্টম এমব্রয়ডারি গাউন",
    price: 15000,
    unitLabel: "শুরু",
    imageAlt: "হাতে তৈরি গর্জিয়াস উইমেন্স গাউন",
    badge: "New",
    status: "available",
    categoryId: "fashion",
  }),
  withMedia("baby-jama-pant-set", {
    slug: "baby-comfort-top-shorts-set",
    title: "বেবি কমফোর্ট টপ-শর্ট সেট",
    subtitle: "হাতে তৈরি | নরম কটন-লিনেন ডেইলি সেট",
    price: 550,
    unitLabel: "শুরু",
    imageAlt: "হাতে তৈরি বেবি কমফোর্ট টপ-শর্ট সেট",
    status: "available",
    categoryId: "fashion",
  }),
  withMedia("baby-daily-frock", {
    slug: "womens-daily-wear-dress",
    title: "উইমেন্স ডেইলি ওয়্যার ড্রেস",
    subtitle: "হাতে তৈরি | নিত্যদিনের আরামদায়ক ড্রেস",
    price: 950,
    unitLabel: "শুরু",
    imageAlt: "হাতে তৈরি উইমেন্স ডেইলি ওয়্যার ড্রেস",
    status: "available",
    categoryId: "fashion",
  }),
];

export const PRICE_FILTER_MIN = 0;
export const PRICE_FILTER_MAX = 8000;

export const productFilters = {
  categories: [
    { id: "gadgets", label: categoryLabels.gadgets },
    { id: "fashion", label: categoryLabels.fashion },
  ],
  availability: [
    { id: "available", label: "এভেইলেবল" },
    { id: "coming-soon", label: "কামিং সুন" },
  ],
  sortOptions: [
    { id: "popularity", label: "জনপ্রিয়তা" },
    { id: "price-asc", label: "দাম: কম থেকে বেশি" },
    { id: "price-desc", label: "দাম: বেশি থেকে কম" },
    { id: "newest", label: "নতুন সংযোজন" },
  ],
} as const;

export type ProductSortId = (typeof productFilters.sortOptions)[number]["id"];

/** Cross-category homepage rails. Real categories stay on `?category=`. */
export type CatalogView = "featured" | "latest" | "new";

const CATALOG_VIEWS: readonly CatalogView[] = ["featured", "latest", "new"];

export function productsHref(options?: {
  category?: ProductCategoryId;
  view?: CatalogView;
}) {
  const params = new URLSearchParams();
  if (options?.view) params.set("view", options.view);
  if (options?.category) params.set("category", options.category);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export function readCatalogQuery(raw: {
  category?: string | null;
  view?: string | null;
}) {
  const category = productFilters.categories.some(
    (item) => item.id === raw.category,
  )
    ? (raw.category as ProductCategoryId)
    : undefined;
  const view = CATALOG_VIEWS.find((item) => item === raw.view);
  const sort: ProductSortId = view === "latest" ? "newest" : "popularity";
  const badge: ProductBadge | undefined = view === "new" ? "New" : undefined;
  const title = category
    ? categoryLabels[category]
    : view === "featured"
      ? "Featured Products"
      : view === "latest"
        ? "Latest Products"
        : view === "new"
          ? "New Arrivals"
          : "সব প্রোডাক্ট";

  return { category, view, sort, badge, title };
}
