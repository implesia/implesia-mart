import {
  CATALOG_SEARCH_MAX_CHARS,
  interpretPublicCatalog,
  type PublicCatalogCard,
} from "@/lib/mart-api/catalog-query";
import { API_BASE_URL, mediaUrl } from "@/lib/mart-api/media-url";
import { publicRequestInit } from "@/lib/mart-api/public-request";

export class SearchUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchUnavailableError";
  }
}

export type SearchType = "all" | "products" | "blogs";

export type SearchBlogHit = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  coverAlt: string;
  author: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
};

export type SearchGroup<T> = { items: T[]; total: number; page: number; pages: number };

export type SearchResults = {
  query: string;
  type: SearchType;
  pageSize: number;
  products: SearchGroup<PublicCatalogCard>;
  blogs: SearchGroup<SearchBlogHit>;
};

/** What the shopper typed, cleaned the way the API cleans it: one line, single spaces, capped. */
export function cleanSearchQuery(raw: string | null | undefined) {
  return (raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CATALOG_SEARCH_MAX_CHARS)
    .trim();
}

export function searchHref(raw: string, page = 1) {
  const q = cleanSearchQuery(raw);
  if (!q) return "/search";
  const params = new URLSearchParams({ q });
  if (page > 1) params.set("page", String(page));
  return `/search?${params}`;
}

export function blogHref(slug: string) {
  return `/blogs/${encodeURIComponent(slug)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function count(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function readBlog(value: unknown): SearchBlogHit | null {
  const record = asRecord(value);
  if (!record) return null;
  const slug = text(record.slug).trim();
  const title = text(record.title).trim();
  if (!slug || !title) return null;
  return {
    id: text(record.id) || slug,
    slug,
    title,
    excerpt: text(record.excerpt),
    coverImage: mediaUrl(text(record.cover_image)),
    coverAlt: text(record.cover_alt) || title,
    author: text(record.author),
    publishedAt: text(record.published_at),
    readTime: text(record.read_time),
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

function group<T>(
  value: unknown,
  read: (item: unknown) => T | null,
): SearchGroup<T> | null {
  const record = asRecord(value);
  if (!record || !Array.isArray(record.items)) return null;
  const items = record.items.flatMap((item) => {
    const one = read(item);
    return one ? [one] : [];
  });
  return {
    items,
    total: count(record.total, items.length),
    page: Math.max(1, count(record.page, 1)),
    pages: count(record.pages, items.length > 0 ? 1 : 0),
  };
}

/** The search response, or `null` when the body is not one (a proxy error page, say). */
export function normalizeSearchResults(body: unknown): SearchResults | null {
  const record = asRecord(body);
  if (!record) return null;
  const products = group(record.products, (item) => interpretPublicCatalog({ items: [item] })?.items[0] ?? null);
  const blogs = group(record.blogs, readBlog);
  if (!products || !blogs) return null;
  const type = record.type === "products" || record.type === "blogs" ? record.type : "all";
  return {
    query: text(record.query),
    type,
    pageSize: Math.max(1, count(record.page_size, 8)),
    products,
    blogs,
  };
}

export type SearchRequest = {
  q: string;
  type?: SearchType;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
};

/** One anonymous call to the search API. Throws `SearchUnavailableError` when it cannot be answered. */
export async function fetchSearch(request: SearchRequest): Promise<SearchResults> {
  const params = new URLSearchParams({ q: cleanSearchQuery(request.q) });
  if (request.type && request.type !== "all") params.set("type", request.type);
  if (request.page && request.page > 1) params.set("page", String(request.page));
  if (request.pageSize) params.set("page_size", String(request.pageSize));
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/v1/search?${params}`,
      publicRequestInit({ signal: request.signal }),
    );
  } catch {
    throw new SearchUnavailableError("Could not reach the API.");
  }
  if (!response.ok) throw new SearchUnavailableError("Search is unavailable right now.");
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SearchUnavailableError("Search returned an unreadable answer.");
  }
  const results = normalizeSearchResults(body);
  if (!results) throw new SearchUnavailableError("Search returned an unexpected answer.");
  return results;
}
