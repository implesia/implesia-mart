import { isCatalogProductId } from "@/lib/mart-api/catalog-rules";

const PRODUCT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const CATEGORY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = new Set(["available", "sold-out", "coming-soon"]);

/** Matches the public cart cap. The server still rejects an illegal quantity. */
export const PURCHASE_QTY_MAX = 5;

export function catalogResponseKind(status: number): "ok" | "missing" | "down" {
  if (status === 404) return "missing";
  if (status >= 200 && status < 300) return "ok";
  return "down";
}

export function isProductSlug(value: string) {
  const text = value.trim().toLowerCase();
  return text.length > 0 && text.length <= 160 && PRODUCT_SLUG.test(text);
}

export function normalizeProductSlug(value: string) {
  const text = value.trim().toLowerCase();
  return isProductSlug(text) ? text : null;
}

export function purchaseQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  const whole = Math.floor(value);
  if (whole < 1) return 1;
  if (whole > PURCHASE_QTY_MAX) return PURCHASE_QTY_MAX;
  return whole;
}

export function banglaNumber(value: number) {
  return String(value).replace(
    /\d/g,
    (digit) => BN_DIGITS[Number(digit)] ?? digit,
  );
}

export function galleryControlName(
  title: string,
  index: number,
  kind: "image" | "video",
) {
  const name = title.trim() || "প্রোডাক্ট";
  const n = banglaNumber(index + 1);
  return kind === "video" ? `${name} — ভিডিও ${n}` : `${name} — ছবি ${n}`;
}

export function directCheckoutHref(
  product: { slug: string; id: string },
  quantity: number,
) {
  const params = new URLSearchParams();
  params.set("product", product.slug);
  if (isCatalogProductId(product.id)) params.set("id", product.id);
  params.set("qty", String(purchaseQuantity(quantity)));
  return `/checkout?${params.toString()}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function textList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export type StoreDetailPayload = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  category_slug: string;
  category_name: string;
  category_path: { slug: string; name: string }[];
  price: number;
  compare_at_price: number | null;
  unit_label: string;
  image_src: string;
  image_alt: string;
  badge: "New" | "Best Seller" | "Limited" | null;
  status: "available" | "sold-out" | "coming-soon";
  featured: boolean;
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
  options: {
    id: string;
    name: string;
    kind: string;
    values: { id: string; label: string; swatch: string }[];
  }[];
  related: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    category: string;
    category_slug: string;
    category_name: string;
    price: number;
    compare_at_price: number | null;
    unit_label: string;
    image_src: string;
    image_alt: string;
    badge: "New" | "Best Seller" | "Limited" | null;
    status: "available" | "sold-out" | "coming-soon";
    featured: boolean;
  }[];
};

const BADGES = new Set(["New", "Best Seller", "Limited"]);

function readCard(value: unknown) {
  const record = asRecord(value);
  if (!record) return null;
  const id = text(record, "id");
  const slug = text(record, "slug").trim().toLowerCase();
  const title = text(record, "title").trim();
  const price = record.price;
  const category = record.category;
  const status = record.status;
  if (!isCatalogProductId(id) || !isProductSlug(slug) || !title) return null;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0)
    return null;
  if (
    typeof category !== "string" ||
    category.length > 80 ||
    !CATEGORY_SLUG.test(category) ||
    !STATUSES.has(String(status))
  )
    return null;
  const badge = record.badge;
  const compare = record.compare_at_price;
  return {
    id,
    slug,
    title,
    subtitle: text(record, "subtitle"),
    category,
    category_slug: text(record, "category_slug") || category,
    category_name: text(record, "category_name"),
    price,
    compare_at_price:
      typeof compare === "number" && Number.isFinite(compare) && compare > price
        ? compare
        : null,
    unit_label: text(record, "unit_label"),
    image_src: text(record, "image_src"),
    image_alt: text(record, "image_alt") || title,
    badge: BADGES.has(String(badge))
      ? (badge as "New" | "Best Seller" | "Limited")
      : null,
    status: status as "available" | "sold-out" | "coming-soon",
    featured: record.featured === true,
  };
}

/** A 200 body that cannot satisfy this shape is an API failure, not a seed product. */
export function normalizeProductDetail(
  body: unknown,
): StoreDetailPayload | null {
  const card = readCard(body);
  const record = asRecord(body);
  if (!card || !record) return null;
  const gallery = Array.isArray(record.gallery)
    ? record.gallery.flatMap((item) => {
        const image = asRecord(item);
        const src = image ? text(image, "src") : "";
        if (!src) return [];
        return [{ src, alt: text(image!, "alt") || card.title }];
      })
    : [];
  const options = Array.isArray(record.options)
    ? record.options.flatMap((item) => {
        const group = asRecord(item);
        if (!group) return [];
        const id = text(group, "id");
        const name = text(group, "name");
        if (!id || !name) return [];
        const values = Array.isArray(group.values)
          ? group.values.flatMap((value) => {
              const row = asRecord(value);
              if (!row) return [];
              const valueId = text(row, "id");
              const label = text(row, "label");
              if (!valueId || !label) return [];
              return [{ id: valueId, label, swatch: text(row, "swatch") }];
            })
          : [];
        return [{ id, name, kind: text(group, "kind"), values }];
      })
    : [];
  const specs = Array.isArray(record.specs)
    ? record.specs.flatMap((item) => {
        const row = asRecord(item);
        if (!row) return [];
        const label = text(row, "label");
        const value = text(row, "value");
        if (!label || !value) return [];
        return [{ label, value, group: text(row, "group") || "general" }];
      })
    : [];
  const faqs = Array.isArray(record.faqs)
    ? record.faqs.flatMap((item) => {
        const row = asRecord(item);
        if (!row) return [];
        const question = text(row, "question");
        const answer = text(row, "answer");
        if (!question || !answer) return [];
        return [{ question, answer }];
      })
    : [];
  const related = Array.isArray(record.related)
    ? record.related.flatMap((item) => {
        const row = readCard(item);
        return row ? [row] : [];
      })
    : [];

  return {
    ...card,
    category_path: Array.isArray(record.category_path)
      ? record.category_path.flatMap((item) => {
          const crumb = asRecord(item);
          const slug = crumb ? text(crumb, "slug") : "";
          const name = crumb ? text(crumb, "name") : "";
          return slug && name && CATEGORY_SLUG.test(slug) ? [{ slug, name }] : [];
        })
      : [],
    tagline: text(record, "tagline"),
    description: text(record, "description"),
    stock_label: text(record, "stock_label"),
    gallery,
    highlights: textList(record.highlights),
    suitable_for: textList(record.suitable_for),
    package_items: textList(record.package_items),
    how_to_use: textList(record.how_to_use),
    story_heading: text(record, "story_heading"),
    story_body: text(record, "story_body"),
    story_bullets: textList(record.story_bullets),
    quality_title: text(record, "quality_title"),
    quality_body: text(record, "quality_body"),
    quality_image_src: text(record, "quality_image_src"),
    quality_image_alt: text(record, "quality_image_alt"),
    specs,
    faqs,
    options,
    related,
  };
}
