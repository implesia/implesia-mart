import { cache } from "react";

import {
  categoryLabels,
  placeholderImage,
  products as staticProducts,
} from "@/app/(client)/_data/products/products";
import { getProductDetailBySlug } from "@/app/(client)/_data/products/product-details";
import type {
  ProductDetail,
  ProductSpecGroupId,
} from "@/app/(client)/_data/products/product-details";
import type {
  Product,
  ProductBadge,
  ProductCategoryId,
  ProductStatus,
} from "@/app/(client)/_data/products/products";

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

const SPEC_GROUPS = new Set<ProductSpecGroupId>([
  "power",
  "connectivity",
  "features",
  "build",
  "dimensions",
  "fabric",
  "construction",
  "sizing",
  "customization",
  "care",
  "timeline",
  "general",
]);

export type StoreDeliveryRates = {
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
};

const FALLBACK_RATES: StoreDeliveryRates = {
  insideDhaka: 70,
  dhakaSuburban: 100,
  outsideDhaka: 130,
  insideEnabled: true,
  suburbanEnabled: true,
  outsideEnabled: true,
};

function taka(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

function deliveryChargeLine(rates: StoreDeliveryRates) {
  const parts = [
    rates.insideEnabled ? `ঢাকার ভেতরে ${taka(rates.insideDhaka)}` : null,
    rates.suburbanEnabled ? `ঢাকার শহরতলি ${taka(rates.dhakaSuburban)}` : null,
    rates.outsideEnabled ? `ঢাকার বাইরে ${taka(rates.outsideDhaka)}` : null,
  ].filter((part) => part != null);
  if (parts.length === 0) return "এখন ডেলিভারি বন্ধ।";
  return `${parts.join(", ")}। ঢাকায় ২৪-৪৮ ঘণ্টা, বাইরে ২৪-৭২ ঘণ্টা।`;
}

function deliveryBlocks(rates: StoreDeliveryRates) {
  return [
    {
      icon: "payments",
      title: "ক্যাশ অন ডেলিভারি",
      description:
        "প্রোডাক্ট হাতে পাওয়ার পর টাকা পরিশোধ করুন। আগে থেকে পেমেন্টের প্রয়োজন নেই।",
    },
    {
      icon: "local_shipping",
      title: "সারাদেশে ডেলিভারি",
      description: deliveryChargeLine(rates),
    },
    {
      icon: "assignment_return",
      title: "৩ দিনের ইজি রিটার্ন",
      description:
        "প্রোডাক্ট ড্যামেজ বা ভিন্ন হলে সহজে রিটার্ন বা রিপ্লেসমেন্ট করা যাবে।",
    },
    {
      icon: "support_agent",
      title: "কাস্টমার সাপোর্ট",
      description:
        "অর্ডার বা প্রোডাক্ট নিয়ে যেকোনো প্রশ্নে ফোন/মেসেজে সাহায্য পাবেন।",
    },
  ];
}

type ApiCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ProductCategoryId;
  price: number;
  compare_at_price: number | null;
  unit_label: string;
  image_src: string;
  image_alt: string;
  badge: ProductBadge | null;
  status: ProductStatus;
  featured: boolean;
};

type ApiDetail = ApiCard & {
  tagline: string;
  description: string;
  stock_label: string;
  gallery: { src: string; alt: string }[];
  highlights: string[];
  suitable_for: string[];
  package_items: string[];
  how_to_use: string[];
  story_heading: string;
  story_body: string;
  story_bullets: string[];
  quality_title: string;
  quality_body: string;
  quality_image_src: string;
  quality_image_alt: string;
  specs: { label: string; value: string; group: string }[];
  faqs: { question: string; answer: string }[];
  related: ApiCard[];
};

function media(src: string) {
  if (!src) return "";
  if (src.startsWith("/media/")) return `${API}${src}`;
  return src;
}

function money(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function catalogProductId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  )
    ? id
    : undefined;
}

function mapCard(item: ApiCard): Product {
  const imageSrc = media(item.image_src) || placeholderImage(item.title);
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle,
    price: item.price,
    compareAtPrice: item.compare_at_price ?? undefined,
    unitLabel: item.unit_label || undefined,
    imageSrc,
    imageAlt: item.image_alt || item.title,
    badge: item.badge ?? undefined,
    status: item.status,
    categoryId: item.category,
    featured: item.featured,
  };
}

function mapDetail(item: ApiDetail, rates: StoreDeliveryRates): ProductDetail {
  const card = mapCard(item);
  const gallery = (
    item.gallery.length > 0
      ? item.gallery
      : [{ src: item.image_src, alt: item.image_alt }]
  )
    .filter((image) => image.src)
    .map((image) => ({
      src: media(image.src),
      alt: image.alt || item.title,
      type: "image" as const,
    }));
  const delivery =
    item.status === "coming-soon"
      ? [
          {
            icon: "notifications",
            title: "শীঘ্রই স্টকে আসছে",
            description: "লঞ্চ হওয়ার সাথে সাথে এই পেজে অর্ডার অপশন চালু হবে।",
          },
          ...deliveryBlocks(rates),
        ]
      : deliveryBlocks(rates);

  return {
    ...card,
    breadcrumbs: [
      { label: "হোম", href: "/" },
      {
        label: categoryLabels[item.category],
        href: `/products?category=${item.category}`,
      },
      { label: item.title },
    ],
    gallery:
      gallery.length > 0
        ? gallery
        : [{ src: card.imageSrc, alt: card.imageAlt, type: "image" }],
    tagline: item.tagline,
    stockLabel: item.stock_label,
    description: item.description,
    keyFeatures: item.highlights,
    suitableFor: item.suitable_for,
    whatsInBox: item.package_items,
    howToUse: item.how_to_use,
    faqs: item.faqs,
    materialDetails: item.specs.map((spec) => ({
      label: spec.label,
      value: spec.value,
      group: SPEC_GROUPS.has(spec.group as ProductSpecGroupId)
        ? (spec.group as ProductSpecGroupId)
        : "general",
    })),
    delivery,
    details: {
      heading: item.story_heading,
      body: item.story_body,
      bullets: item.story_bullets,
      authenticity: {
        title: item.quality_title,
        body: item.quality_body,
        imageSrc: media(item.quality_image_src),
        imageAlt: item.quality_image_alt || item.title,
      },
    },
    related: item.related.map((related) => {
      const mapped = mapCard(related);
      return {
        id: mapped.id,
        slug: mapped.slug,
        title: mapped.title,
        priceLabel: money(mapped.price),
        imageSrc: mapped.imageSrc,
        imageAlt: mapped.imageAlt,
        status: mapped.status,
      };
    }),
  };
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Published catalog. Slug stays a URL; the resource key is the product id. */
export const listStoreProducts = cache(async (): Promise<Product[]> => {
  const all: Product[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages && page <= 20) {
    const body = await readJson<{ items?: ApiCard[]; pages?: number }>(
      `/api/v1/products?page=${page}&page_size=48`,
    );
    if (!body) break;
    for (const item of body.items ?? []) all.push(mapCard(item));
    pages = body.pages ?? 1;
    page += 1;
  }
  // Production catalog is empty until products are published in admin.
  // Keep the existing storefront visible until then.
  return all.length > 0 ? all : staticProducts;
});

export const getStoreProduct = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const list = await listStoreProducts();
    const card = list.find((product) => product.slug === slug);
    if (!card) return null;
    if (!catalogProductId(card.id)) return getProductDetailBySlug(slug);
    const detail = await readJson<ApiDetail>(`/api/v1/products/${card.id}`);
    if (!detail || detail.slug !== slug) return null;
    return mapDetail(detail, await getStoreDeliveryRates());
  },
);

export const getStoreDeliveryRates = cache(
  async (): Promise<StoreDeliveryRates> => {
    const body = await readJson<{
      inside_dhaka?: number;
      dhaka_suburban?: number;
      outside_dhaka?: number;
      inside_enabled?: boolean;
      suburban_enabled?: boolean;
      outside_enabled?: boolean;
    }>("/api/v1/delivery");
    if (
      typeof body?.inside_dhaka !== "number" ||
      typeof body.dhaka_suburban !== "number" ||
      typeof body.outside_dhaka !== "number"
    ) {
      return FALLBACK_RATES;
    }
    return {
      insideDhaka: body.inside_dhaka,
      dhakaSuburban: body.dhaka_suburban,
      outsideDhaka: body.outside_dhaka,
      insideEnabled: body.inside_enabled ?? true,
      suburbanEnabled: body.suburban_enabled ?? true,
      outsideEnabled: body.outside_enabled ?? true,
    };
  },
);
