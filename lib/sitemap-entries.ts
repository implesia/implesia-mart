// Same URL as `categoryHref` in lib/mart-api/categories (not imported: that module pulls
// in the API client, and this one stays pure for tests).
const categoryHref = (slug: string) => `/products?category=${encodeURIComponent(slug)}`;

/** Node of `GET /api/v1/categories/tree` as far as the sitemap needs it. */
export type SitemapCategoryNode = {
  slug?: unknown;
  product_count?: unknown;
  updated_at?: unknown;
  children?: unknown;
};

export type SitemapCategory = { path: string; lastModified?: Date };

/** A real date from the API, or undefined (the sitemap then omits lastmod). */
export function lastModified(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Visible categories that have published products, depth-first, each as its catalog URL
 * (`/products?category=<slug>`, the same URL the category page uses as canonical).
 */
export function sitemapCategories(nodes: unknown): SitemapCategory[] {
  const out: SitemapCategory[] = [];
  const seen = new Set<string>();
  const walk = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const raw of list as SitemapCategoryNode[]) {
      if (!raw || typeof raw !== "object") continue;
      const slug = typeof raw.slug === "string" ? raw.slug : "";
      const count = typeof raw.product_count === "number" ? raw.product_count : 0;
      if (slug && count > 0 && !seen.has(slug)) {
        seen.add(slug);
        const date = lastModified(raw.updated_at);
        out.push({ path: categoryHref(slug), ...(date ? { lastModified: date } : {}) });
      }
      walk(raw.children);
    }
  };
  walk(nodes);
  return out;
}

/** Latest of the given dates (for the home and listing URLs), or undefined. */
export function latest(dates: (Date | undefined)[]): Date | undefined {
  let best: Date | undefined;
  for (const date of dates) if (date && (!best || date > best)) best = date;
  return best;
}
