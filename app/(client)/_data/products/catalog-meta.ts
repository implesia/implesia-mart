export type ProductBadge = "New" | "Best Seller" | "Limited";
export type ProductStatus = "available" | "sold-out" | "coming-soon";
export type ProductCategoryId = "gadgets" | "fashion";

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
  categoryId: ProductCategoryId;
  featured?: boolean;
};

export const categoryLabels: Record<ProductCategoryId, string> = {
  gadgets: "Trending Gadgets",
  fashion: "গর্জিয়াস ড্রেস",
};

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
