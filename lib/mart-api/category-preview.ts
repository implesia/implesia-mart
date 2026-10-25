/** Product preview shown in the hero menu's product panel. Pure parsing, no network. */
export const PREVIEW_LIMIT = 6;

export type CategoryPreviewProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  imageSrc: string;
  imageAlt: string;
  status: string;
};

export type CategoryPreview = {
  products: CategoryPreviewProduct[];
  total: number;
};

export function categoryPreviewPath(slug: string, limit = PREVIEW_LIMIT) {
  const size = Math.min(48, Math.max(1, Math.trunc(limit)));
  return `/api/v1/categories/${encodeURIComponent(slug)}/products?page_size=${size}&include_descendants=true&sort=popularity`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Returns null when the body is not the list shape, so the caller can show the error state. */
export function parseCategoryPreview(body: unknown, limit = PREVIEW_LIMIT): CategoryPreview | null {
  if (!isRecord(body) || !Array.isArray(body.items)) return null;
  const products: CategoryPreviewProduct[] = [];
  for (const raw of body.items) {
    if (!isRecord(raw)) continue;
    const { id, slug, title, price } = raw;
    if (typeof id !== "string" || typeof slug !== "string" || typeof title !== "string") continue;
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) continue;
    products.push({
      id,
      slug,
      title,
      price,
      compareAtPrice:
        typeof raw.compare_at_price === "number" && raw.compare_at_price > price
          ? raw.compare_at_price
          : null,
      imageSrc: typeof raw.image_src === "string" ? raw.image_src : "",
      imageAlt: typeof raw.image_alt === "string" && raw.image_alt ? raw.image_alt : title,
      status: typeof raw.status === "string" ? raw.status : "available",
    });
    if (products.length >= limit) break;
  }
  const total = typeof body.total === "number" && body.total >= products.length ? body.total : products.length;
  return { products, total };
}
