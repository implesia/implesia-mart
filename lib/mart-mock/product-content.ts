import {
  deliveryBlocks,
  getProductDetailBySlug,
  relatedForCategory,
  type ProductDetail,
  type ProductSpecGroupId,
} from "@/app/(client)/_data/products/product-details";
import {
  categoryLabels,
  type Product,
  type ProductBadge,
  type ProductCategoryId,
  type ProductStatus,
} from "@/app/(client)/_data/products/products";
import type { ProductGalleryItem } from "@/app/(client)/_data/products/product-media";

export type ProductGalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export type ProductSpecRow = {
  id: string;
  label: string;
  value: string;
  group: ProductSpecGroupId;
};

export type ProductFaqRow = {
  id: string;
  question: string;
  answer: string;
};

export type ProductOptionKind = "color" | "size" | "text";

export type ProductOptionValue = {
  id: string;
  label: string;
  swatch: string;
};

export type ProductOptionGroup = {
  id: string;
  name: string;
  kind: ProductOptionKind;
  values: ProductOptionValue[];
};

export type ChosenOption = {
  name: string;
  label: string;
  swatch: string;
};

/** Copy the product page actually renders, separate from price and stock status. */
export type ProductStorefrontContent = {
  tagline: string;
  description: string;
  stockLabel: string;
  unitLabel: string;
  imageAlt: string;
  gallery: ProductGalleryImage[];
  highlights: string[];
  suitableFor: string[];
  packageItems: string[];
  howToUse: string[];
  storyHeading: string;
  storyBody: string;
  storyBullets: string[];
  qualityTitle: string;
  qualityBody: string;
  specs: ProductSpecRow[];
  faqs: ProductFaqRow[];
  options: ProductOptionGroup[];
};

export type ManagedProductFields = {
  title: string;
  subtitle: string;
  categoryId: ProductCategoryId;
  price: number;
  compareAtPrice: number | null;
  status: "available" | "sold-out" | "coming-soon";
  badge: ProductBadge | null;
  imageSrc: string;
  content: ProductStorefrontContent;
};

export const SPEC_GROUP_OPTIONS: { id: ProductSpecGroupId; label: string }[] = [
  { id: "fabric", label: "Fabric" },
  { id: "construction", label: "Construction" },
  { id: "sizing", label: "Size" },
  { id: "customization", label: "Customization" },
  { id: "care", label: "Care" },
  { id: "timeline", label: "Timing" },
  { id: "power", label: "Power" },
  { id: "connectivity", label: "Connectivity" },
  { id: "features", label: "Features" },
  { id: "build", label: "Build" },
  { id: "dimensions", label: "Dimensions" },
  { id: "general", label: "General" },
];

const DEFAULT_QUALITY_TITLE = "কোয়ালিটি চেকড প্রোডাক্ট";
const DEFAULT_QUALITY_BODY =
  "প্রতিটি প্রোডাক্ট ডেলিভারির আগে পরীক্ষা করা হয়, যাতে আপনার হাতে পৌঁছায় সম্পূর্ণ কার্যকর একটি আইটেম।";

export function emptyProductContent(): ProductStorefrontContent {
  return {
    tagline: "",
    description: "",
    stockLabel: "স্টকে আছে",
    unitLabel: "",
    imageAlt: "",
    gallery: [],
    highlights: [],
    suitableFor: [],
    packageItems: [],
    howToUse: [],
    storyHeading: "",
    storyBody: "",
    storyBullets: [],
    qualityTitle: DEFAULT_QUALITY_TITLE,
    qualityBody: DEFAULT_QUALITY_BODY,
    specs: [],
    faqs: [],
    options: [],
  };
}

export function seedProductContent(slug: string): ProductStorefrontContent {
  const detail = getProductDetailBySlug(slug);
  if (!detail) return emptyProductContent();
  return {
    tagline: detail.tagline,
    description: detail.description,
    stockLabel: detail.stockLabel,
    unitLabel: detail.unitLabel ?? "",
    imageAlt: detail.imageAlt,
    gallery: detail.gallery
      .filter((item) => item.type === "image")
      .map((item, index) => ({
        id: `gallery-${index + 1}`,
        src: item.src,
        alt: item.alt,
      })),
    highlights: [...(detail.keyFeatures ?? [])],
    suitableFor: [...(detail.suitableFor ?? [])],
    packageItems: [...(detail.whatsInBox ?? [])],
    howToUse: [...(detail.howToUse ?? [])],
    storyHeading: detail.details.heading,
    storyBody: detail.details.body,
    storyBullets: [...detail.details.bullets],
    qualityTitle: detail.details.authenticity.title,
    qualityBody: detail.details.authenticity.body,
    specs: (detail.materialDetails ?? []).map((item, index) => ({
      id: `spec-${index + 1}`,
      label: item.label,
      value: item.value,
      group: item.group ?? "general",
    })),
    faqs: (detail.faqs ?? []).map((item, index) => ({
      id: `faq-${index + 1}`,
      question: item.question,
      answer: item.answer,
    })),
    options: [],
  };
}

export function mergeProductContent(
  seed: ProductStorefrontContent,
  stored?: Partial<ProductStorefrontContent> | null,
): ProductStorefrontContent {
  if (!stored) return seed;
  return {
    ...seed,
    ...stored,
    gallery: stored.gallery ?? seed.gallery,
    highlights: stored.highlights ?? seed.highlights,
    suitableFor: stored.suitableFor ?? seed.suitableFor,
    packageItems: stored.packageItems ?? seed.packageItems,
    howToUse: stored.howToUse ?? seed.howToUse,
    storyBullets: stored.storyBullets ?? seed.storyBullets,
    specs: stored.specs ?? seed.specs,
    faqs: stored.faqs ?? seed.faqs,
    options: stored.options ?? seed.options,
  };
}

export function cleanProductContent(content: ProductStorefrontContent): ProductStorefrontContent {
  const lines = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
  return {
    ...content,
    tagline: content.tagline.trim(),
    description: content.description.trim(),
    stockLabel: content.stockLabel.trim(),
    unitLabel: content.unitLabel.trim(),
    imageAlt: content.imageAlt.trim(),
    storyHeading: content.storyHeading.trim(),
    storyBody: content.storyBody.trim(),
    qualityTitle: content.qualityTitle.trim(),
    qualityBody: content.qualityBody.trim(),
    gallery: content.gallery
      .map((item) => ({ ...item, src: item.src.trim(), alt: item.alt.trim() }))
      .filter((item) => item.src),
    highlights: lines(content.highlights),
    suitableFor: lines(content.suitableFor),
    packageItems: lines(content.packageItems),
    howToUse: lines(content.howToUse),
    storyBullets: lines(content.storyBullets),
    specs: content.specs
      .map((item) => ({ ...item, label: item.label.trim(), value: item.value.trim() }))
      .filter((item) => item.label && item.value),
    faqs: content.faqs
      .map((item) => ({ ...item, question: item.question.trim(), answer: item.answer.trim() }))
      .filter((item) => item.question && item.answer),
    options: content.options
      .map((group) => ({
        ...group,
        name: group.name.trim(),
        values: group.values
          .map((value) => ({ ...value, label: value.label.trim(), swatch: value.swatch.trim() }))
          .filter((value) => value.label),
      }))
      .filter((group) => group.name && group.values.length > 0),
  };
}

export function blankGalleryImage(): ProductGalleryImage {
  return { id: newId("gallery"), src: "", alt: "" };
}

export function blankSpec(): ProductSpecRow {
  return { id: newId("spec"), label: "", value: "", group: "general" };
}

export function blankFaq(): ProductFaqRow {
  return { id: newId("faq"), question: "", answer: "" };
}

export function applyAdminToDetail(base: ProductDetail, admin: ManagedProductFields): ProductDetail {
  const content = admin.content;
  const videos = base.gallery.filter((item) => item.type === "video");
  const images = galleryImages(admin);
  const status = storefrontStatus(admin.status, base.status);
  return {
    ...base,
    title: admin.title,
    subtitle: admin.subtitle,
    categoryId: admin.categoryId,
    price: admin.price,
    compareAtPrice: admin.compareAtPrice ?? undefined,
    unitLabel: content.unitLabel || undefined,
    imageSrc: admin.imageSrc || base.imageSrc,
    imageAlt: content.imageAlt || admin.title,
    badge: admin.badge ?? undefined,
    status,
    tagline: content.tagline,
    description: content.description,
    stockLabel: content.stockLabel,
    keyFeatures: content.highlights,
    suitableFor: content.suitableFor,
    whatsInBox: content.packageItems,
    howToUse: content.howToUse,
    faqs: content.faqs.map(({ question, answer }) => ({ question, answer })),
    materialDetails: content.specs.map(({ label, value, group }) => ({ label, value, group })),
    gallery: [...videos, ...images],
    breadcrumbs: [
      { label: "হোম", href: "/" },
      { label: categoryLabels[admin.categoryId], href: "/products" },
      { label: admin.title },
    ],
    details: {
      ...base.details,
      heading: content.storyHeading,
      body: content.storyBody,
      bullets: content.storyBullets,
      authenticity: {
        ...base.details.authenticity,
        title: content.qualityTitle || DEFAULT_QUALITY_TITLE,
        body: content.qualityBody || DEFAULT_QUALITY_BODY,
      },
    },
    delivery: deliveryBlocks(admin.categoryId, status),
    related: relatedForCategory(base.slug, admin.categoryId),
  };
}

export function detailFromAdmin(admin: ManagedProductFields & { slug: string }): ProductDetail {
  const status = storefrontStatus(admin.status, "available");
  const images = galleryImages(admin);
  const primary = images[0];
  return {
    id: admin.slug as Product["id"],
    slug: admin.slug,
    title: admin.title,
    subtitle: admin.subtitle,
    price: admin.price,
    compareAtPrice: admin.compareAtPrice ?? undefined,
    unitLabel: admin.content.unitLabel || undefined,
    imageSrc: admin.imageSrc || primary?.src || "",
    imageAlt: admin.content.imageAlt || admin.title,
    badge: admin.badge ?? undefined,
    status,
    categoryId: admin.categoryId,
    tagline: admin.content.tagline,
    description: admin.content.description,
    stockLabel: admin.content.stockLabel,
    breadcrumbs: [
      { label: "হোম", href: "/" },
      { label: categoryLabels[admin.categoryId], href: "/products" },
      { label: admin.title },
    ],
    gallery: images,
    keyFeatures: admin.content.highlights,
    suitableFor: admin.content.suitableFor,
    whatsInBox: admin.content.packageItems,
    howToUse: admin.content.howToUse,
    faqs: admin.content.faqs.map(({ question, answer }) => ({ question, answer })),
    materialDetails: admin.content.specs.map(({ label, value, group }) => ({ label, value, group })),
    delivery: deliveryBlocks(admin.categoryId, status),
    details: {
      heading: admin.content.storyHeading,
      body: admin.content.storyBody,
      bullets: admin.content.storyBullets,
      authenticity: {
        title: admin.content.qualityTitle || DEFAULT_QUALITY_TITLE,
        body: admin.content.qualityBody || DEFAULT_QUALITY_BODY,
        imageSrc: admin.imageSrc || primary?.src || "",
        imageAlt: admin.content.imageAlt || admin.title,
      },
    },
    related: relatedForCategory(admin.slug, admin.categoryId),
  };
}

function galleryImages(admin: ManagedProductFields): ProductGalleryItem[] {
  const fromList = admin.content.gallery
    .filter((item) => item.src.trim())
    .map((item) => ({
      type: "image" as const,
      src: item.src,
      alt: item.alt || admin.title,
    }));
  if (fromList.length > 0) return fromList;
  if (!admin.imageSrc) return [];
  return [{ type: "image", src: admin.imageSrc, alt: admin.content.imageAlt || admin.title }];
}

function storefrontStatus(
  status: ManagedProductFields["status"],
  fallback: ProductStatus,
): Product["status"] {
  if (status === "coming-soon") return "coming-soon";
  if (status === "available") return "available";
  return fallback === "coming-soon" ? "coming-soon" : "available";
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
