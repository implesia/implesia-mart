export const CATALOG_PAGE_SIZE = 8;

export type CatalogPageResult<T> = {
  items: T[];
  total: number;
  nextOffset: number;
  hasMore: boolean;
};

/**
 * Local stand-in for `GET /products?offset=&limit=`.
 * Replace this body with a fetch when the catalog API exists.
 */
export async function loadCatalogPage<T>(
  source: readonly T[],
  offset: number,
  limit = CATALOG_PAGE_SIZE,
): Promise<CatalogPageResult<T>> {
  const start = Math.max(0, offset);
  const size = Math.max(1, limit);
  const items = source.slice(start, start + size);
  const nextOffset = start + items.length;

  return {
    items,
    total: source.length,
    nextOffset,
    hasMore: nextOffset < source.length,
  };
}
