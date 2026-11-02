import {
  CATALOG_PAGE_SIZE,
  catalogHref,
  readCatalogSearch,
  toApiSearchParams,
} from "@/lib/mart-api/catalog-query";

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

/** Where an out-of-range page number should go, or null when the page exists. */
export function outOfRangeTarget(searchParams: URLSearchParams, pages: number): string | null {
  const search = readCatalogSearch(Object.fromEntries(searchParams));
  if (pages <= 0 || search.page <= pages) return null;
  return catalogHref({ ...search, page: pages });
}

/**
 * `/products?page=N` beyond the last page: asks the API how many pages the same
 * filters have, so the proxy can answer with a real redirect before any HTML
 * streams. Pages 1, other paths and any API problem return null (the page renders).
 */
export async function catalogPageRedirect(url: URL): Promise<string | null> {
  if (url.pathname !== "/products") return null;
  const search = readCatalogSearch(Object.fromEntries(url.searchParams));
  if (search.page <= 1 || search.statuses.length === 0) return null;
  try {
    const params = toApiSearchParams(search, { page: 1, pageSize: CATALOG_PAGE_SIZE });
    const response = await fetch(`${API}/api/v1/products?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { pages?: unknown };
    return typeof body.pages === "number" ? outOfRangeTarget(url.searchParams, body.pages) : null;
  } catch {
    return null;
  }
}
