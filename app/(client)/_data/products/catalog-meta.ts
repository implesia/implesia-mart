export type ProductBadge = "New" | "Best Seller" | "Limited";
export type ProductStatus = "available" | "sold-out" | "coming-soon";
/** A category slug. Categories are managed in the admin; "gadgets" and "fashion" are the seeded roots. */
export type ProductCategoryId = string;

export const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isCategorySlug(value: unknown): value is ProductCategoryId {
  return typeof value === "string" && value.length <= 80 && CATEGORY_SLUG_PATTERN.test(value);
}

export type ProductCategoryCrumb = { slug: string; name: string };

export type Product = {
  id: string;
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
  /** Slug of the TOP-LEVEL category (drives the fashion/gadget layouts). */
  categoryId: ProductCategoryId;
  /** The category the product is assigned to, and its name. */
  categorySlug?: string;
  categoryName?: string;
  /** Root to leaf, only on product detail. */
  categoryPath?: ProductCategoryCrumb[];
  featured?: boolean;
};

/** Fallback names for the seeded roots; the API's category name wins when present. */
export const categoryLabels: Record<string, string> = {
  gadgets: "Trending Gadgets",
  fashion: "গর্জিয়াস ড্রেস",
};

export function categoryLabel(slug: string, name?: string | null) {
  if (name) return name;
  const known = categoryLabels[slug];
  if (known) return known;
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Slider ceiling only. An unset price filter does not apply this limit. */
export const PRICE_FILTER_MIN = 0;
export const PRICE_FILTER_MAX = 100_000;

export const productFilters = {
  categories: [
    { id: "gadgets", label: categoryLabels.gadgets },
    { id: "fashion", label: categoryLabels.fashion },
  ],
  availability: [
    { id: "available", label: "স্টকে আছে" },
    { id: "sold-out", label: "শেষ" },
    { id: "coming-soon", label: "শীঘ্রই আসছে" },
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
