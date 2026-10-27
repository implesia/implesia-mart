import { isCatalogProductId } from "@/lib/mart-api/catalog-rules";
import { normalizeProductSlug } from "@/lib/mart-api/product-page";

export type ProductRef =
  | { kind: "id"; id: string; canonical: boolean }
  | { kind: "slug"; slug: string }
  | { kind: "invalid" };

/**
 * Canonical storefront path: `/products/{id}`. A card without a real catalog id
 * (a static seed row) falls back to the legacy slug path, which redirects to the
 * canonical URL when that product exists and is a 404 otherwise.
 */
export function productPath(product: { id?: string | null; slug: string }) {
  const id = product.id?.trim();
  if (id && isCatalogProductId(id)) return `/products/${id.toLowerCase()}`;
  return `/products/${encodeURIComponent(product.slug)}`;
}

/** What a `/products/[ref]` segment is: a product id, a legacy slug, or neither. */
export function parseProductRef(param: string): ProductRef {
  let value: string;
  try {
    value = decodeURIComponent(param).trim();
  } catch {
    return { kind: "invalid" };
  }
  if (isCatalogProductId(value)) {
    return { kind: "id", id: value.toLowerCase(), canonical: value === value.toLowerCase() };
  }
  const slug = normalizeProductSlug(value);
  return slug ? { kind: "slug", slug } : { kind: "invalid" };
}
