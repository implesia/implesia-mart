const CATALOG_PRODUCT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCatalogProductId(id: string) {
  return CATALOG_PRODUCT_ID.test(id);
}

/** A public card must be a real published API product, never a local seed row. */
export function isPublicCatalogCard(item: {
  id: string;
  slug: string;
  title: string;
  price: number;
}) {
  return (
    isCatalogProductId(item.id) &&
    item.slug.trim().length > 0 &&
    item.title.trim().length > 0 &&
    Number.isFinite(item.price) &&
    item.price >= 0
  );
}
