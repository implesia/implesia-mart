import {
  categoryLabels,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  type CatalogView,
  type Product,
  type ProductBadge,
  type ProductCategoryId,
  type ProductSortId,
  type ProductStatus,
} from "@/app/(client)/_data/products/catalog-meta";

import { isPublicCatalogCard } from "@/lib/mart-api/catalog-rules";

export const CATALOG_PAGE_SIZE = 12;
export const CATALOG_SEARCH_PAGE_SIZE = 48;
/** Public list has no text-search parameter, so a query scans a bounded number of pages. */
export const CATALOG_SEARCH_SCAN_PAGES = 4;

const CATEGORIES = new Set<ProductCategoryId>(["gadgets", "fashion"]);
const STATUSES: readonly ProductStatus[] = ["available", "sold-out", "coming-soon"];
const STATUS_SET = new Set<ProductStatus>(STATUSES);
const SORTS = new Set<ProductSortId>(["popularity", "price-asc", "price-desc", "newest"]);
const VIEWS = new Set<CatalogView>(["featured", "latest", "new"]);
const BADGES = new Set<ProductBadge>(["New", "Best Seller", "Limited"]);

export const DEFAULT_CATALOG_STATUSES: ProductStatus[] = ["available", "sold-out"];

export type CatalogSearch = {
  category?: ProductCategoryId;
  statuses: ProductStatus[];
  view?: CatalogView;
  sort: ProductSortId;
  minPrice: number | null;
  maxPrice: number | null;
  page: number;
  q: string;
};

export type PublicCatalogCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ProductCategoryId;
  price: number;
  compareAtPrice?: number;
  unitLabel?: string;
  imageSrc: string;
  imageAlt: string;
  badge?: ProductBadge;
  status: ProductStatus;
  featured: boolean;
};

export type InterpretedCatalog = {
  items: PublicCatalogCard[];
  total: number;
  page: number;
  pages: number;
  categoryCounts: Record<ProductCategoryId, number>;
  availabilityCounts: Record<ProductStatus, number>;
};

type RawParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function canonicalizeStatuses(statuses: readonly ProductStatus[]) {
  return STATUSES.filter((status) => statuses.includes(status));
}

function sameStatuses(left: readonly ProductStatus[], right: readonly ProductStatus[]) {
  const a = canonicalizeStatuses(left);
  const b = canonicalizeStatuses(right);
  return a.length === b.length && a.every((status, index) => status === b[index]);
}

function parseStatuses(raw: string | undefined): ProductStatus[] {
  if (raw == null) return [...DEFAULT_CATALOG_STATUSES];
  if (raw.trim() === "none") return [];
  const next: ProductStatus[] = [];
  for (const part of raw.split(",")) {
    const status = part.trim();
    if (!STATUS_SET.has(status as ProductStatus) || next.includes(status as ProductStatus)) continue;
    next.push(status as ProductStatus);
  }
  return next.length > 0 ? canonicalizeStatuses(next) : [...DEFAULT_CATALOG_STATUSES];
}

function parsePrice(raw: string | undefined) {
  if (raw == null || raw.trim() === "") return null;
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < PRICE_FILTER_MIN || value > PRICE_FILTER_MAX) return null;
  return value;
}

function parsePage(raw: string | undefined) {
  if (raw == null || raw.trim() === "") return 1;
  if (!/^\d+$/.test(raw.trim())) return 1;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > 10_000) return 1;
  return value;
}

export function readCatalogSearch(raw: RawParams): CatalogSearch {
  const categoryRaw = firstParam(raw.category)?.trim();
  const viewRaw = firstParam(raw.view)?.trim();
  const sortRaw = firstParam(raw.sort)?.trim();
  const category = categoryRaw && CATEGORIES.has(categoryRaw as ProductCategoryId)
    ? (categoryRaw as ProductCategoryId)
    : undefined;
  const view = viewRaw && VIEWS.has(viewRaw as CatalogView) ? (viewRaw as CatalogView) : undefined;
  const explicitSort = sortRaw && SORTS.has(sortRaw as ProductSortId)
    ? (sortRaw as ProductSortId)
    : undefined;
  const sort = explicitSort ?? (view === "latest" ? "newest" : "popularity");
  let minPrice = parsePrice(firstParam(raw.min_price));
  let maxPrice = parsePrice(firstParam(raw.max_price));
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  if (minPrice === PRICE_FILTER_MIN) minPrice = null;
  if (maxPrice === PRICE_FILTER_MAX) maxPrice = null;

  return {
    category,
    statuses: parseStatuses(firstParam(raw.status)),
    view,
    sort,
    minPrice,
    maxPrice,
    page: parsePage(firstParam(raw.page)),
    q: cleanText(firstParam(raw.q) ?? ""),
  };
}

export function isUnfilteredCatalog(search: CatalogSearch) {
  return (
    search.category == null &&
    search.view == null &&
    search.q.length === 0 &&
    search.sort === "popularity" &&
    search.minPrice == null &&
    search.maxPrice == null &&
    sameStatuses(search.statuses, DEFAULT_CATALOG_STATUSES) &&
    search.page === 1
  );
}

export function readCatalogQuery(raw: {
  category?: string | null;
  view?: string | null;
}) {
  const search = readCatalogSearch({
    category: raw.category ?? undefined,
    view: raw.view ?? undefined,
  });
  return {
    category: search.category,
    view: search.view,
    sort: search.sort,
    badge: search.view === "new" ? ("New" as const) : undefined,
    title: catalogTitle(search),
  };
}

export function catalogTitle(search: CatalogSearch) {
  if (search.q) return "খোঁজার ফল";
  if (search.category) return categoryLabels[search.category];
  if (search.view === "featured") return "ফিচার্ড প্রোডাক্ট";
  if (search.view === "latest") return "সর্বশেষ প্রোডাক্ট";
  if (search.view === "new") return "নতুন আগমন";
  return "সব প্রোডাক্ট";
}

export function toBrowserSearchParams(search: CatalogSearch) {
  const params = new URLSearchParams();
  if (search.category) params.set("category", search.category);
  if (search.view) params.set("view", search.view);
  if (search.q) params.set("q", search.q);
  const defaultSort = search.view === "latest" ? "newest" : "popularity";
  if (search.sort !== defaultSort) params.set("sort", search.sort);
  if (!sameStatuses(search.statuses, DEFAULT_CATALOG_STATUSES)) {
    params.set("status", search.statuses.length === 0 ? "none" : search.statuses.join(","));
  }
  if (search.minPrice != null) params.set("min_price", String(search.minPrice));
  if (search.maxPrice != null) params.set("max_price", String(search.maxPrice));
  if (search.page > 1) params.set("page", String(search.page));
  return params;
}

export function catalogHref(search: CatalogSearch) {
  const query = toBrowserSearchParams(search).toString();
  return query ? `/products?${query}` : "/products";
}

export function toApiSearchParams(
  search: CatalogSearch,
  options: { page: number; pageSize: number },
) {
  const params = new URLSearchParams();
  if (search.category) params.set("category", search.category);
  if (search.statuses.length > 0 && search.statuses.length < STATUSES.length) {
    params.set("status", search.statuses.join(","));
  }
  if (search.view === "featured" || search.view === "new") params.set("view", search.view);
  if (search.sort !== "popularity") params.set("sort", search.sort);
  if (search.minPrice != null) params.set("min_price", String(search.minPrice));
  if (search.maxPrice != null) params.set("max_price", String(search.maxPrice));
  params.set("page", String(options.page));
  params.set("page_size", String(options.pageSize));
  return params;
}

export function matchesCatalogText(
  product: { title: string; subtitle: string },
  query: string,
) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${product.title} ${product.subtitle}`.toLowerCase().includes(needle);
}

export function paginateMatches<T>(items: readonly T[], page: number, size: number) {
  const total = items.length;
  const pages = total === 0 ? 0 : Math.ceil(total / size);
  const current = pages === 0 ? 1 : Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    total,
    page: current,
    pages,
  };
}

function countFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCard(value: unknown): PublicCatalogCard | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = typeof record.id === "string" ? record.id : "";
  const slug = typeof record.slug === "string" ? record.slug : "";
  const title = typeof record.title === "string" ? record.title : "";
  const price = typeof record.price === "number" ? record.price : Number.NaN;
  if (!isPublicCatalogCard({ id, slug, title, price })) return null;
  if (record.published === false) return null;
  const category = record.category;
  const status = record.status;
  if (!CATEGORIES.has(category as ProductCategoryId)) return null;
  if (!STATUS_SET.has(status as ProductStatus)) return null;
  const badge = record.badge;
  const compare = record.compare_at_price;
  return {
    id,
    slug,
    title: title.trim(),
    subtitle: typeof record.subtitle === "string" ? record.subtitle : "",
    category: category as ProductCategoryId,
    price,
    compareAtPrice:
      typeof compare === "number" && Number.isFinite(compare) && compare > price
        ? compare
        : undefined,
    unitLabel: typeof record.unit_label === "string" ? record.unit_label : undefined,
    imageSrc: typeof record.image_src === "string" ? record.image_src : "",
    imageAlt: typeof record.image_alt === "string" ? record.image_alt : title.trim(),
    badge: BADGES.has(badge as ProductBadge) ? (badge as ProductBadge) : undefined,
    status: status as ProductStatus,
    featured: record.featured === true,
  };
}

/** A published list payload. `null` means the body is not a catalog response. */
export function interpretPublicCatalog(body: unknown): InterpretedCatalog | null {
  const record = asRecord(body);
  if (!record || !Array.isArray(record.items)) return null;
  const items = record.items.flatMap((item) => {
    const card = readCard(item);
    return card ? [card] : [];
  });
  const categories = asRecord(record.category_counts);
  const availability = asRecord(record.availability_counts);
  const page = countFrom(record.page) || 1;
  const pages = countFrom(record.pages);
  const total = typeof record.total === "number" && Number.isFinite(record.total)
    ? Math.max(0, record.total)
    : items.length;
  return {
    items,
    total,
    page,
    pages,
    categoryCounts: {
      gadgets: countFrom(categories?.gadgets),
      fashion: countFrom(categories?.fashion),
    },
    availabilityCounts: {
      available: countFrom(availability?.available),
      "sold-out": countFrom(availability?.sold_out),
      "coming-soon": countFrom(availability?.coming_soon),
    },
  };
}

export function emptyCatalogCounts() {
  return {
    categoryCounts: { gadgets: 0, fashion: 0 } satisfies Record<ProductCategoryId, number>,
    availabilityCounts: {
      available: 0,
      "sold-out": 0,
      "coming-soon": 0,
    } satisfies Record<ProductStatus, number>,
  };
}

export type CatalogPageData = {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  unavailable: boolean;
  searchTruncated: boolean;
  categoryCounts: Record<ProductCategoryId, number>;
  availabilityCounts: Record<ProductStatus, number>;
};
