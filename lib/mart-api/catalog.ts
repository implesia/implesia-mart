import { cache } from "react";

import { categoryLabel } from "@/app/(client)/_data/products/catalog-meta";
import type {
  ProductDetail,
  ProductSpecGroupId,
} from "@/app/(client)/_data/products/product-details";
import type {
  Product,
  ProductBadge,
  ProductCategoryId,
  ProductStatus,
} from "@/app/(client)/_data/products/catalog-meta";
import { isCatalogProductId } from "@/lib/mart-api/catalog-rules";
import {
  catalogResponseKind,
  normalizeProductDetail,
  normalizeProductSlug,
} from "@/lib/mart-api/product-page";
import {
  CATALOG_PAGE_SIZE,
  CATALOG_SEARCH_PAGE_SIZE,
  CATALOG_SEARCH_SCAN_PAGES,
  emptyCatalogCounts,
  interpretPublicCatalog,
  matchesCatalogText,
  paginateMatches,
  toApiSearchParams,
  type CatalogPageData,
  type CatalogSearch,
  type PublicCatalogCard,
} from "@/lib/mart-api/catalog-query";

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

const SPEC_GROUPS = new Set<ProductSpecGroupId>([
  "power",
  "connectivity",
  "features",
  "build",
  "dimensions",
  "fabric",
  "construction",
  "sizing",
  "customization",
  "care",
  "timeline",
  "general",
]);

export type StoreDeliveryRates = {
  insideDhaka: number;
  dhakaSuburban: number;
  outsideDhaka: number;
  insideEnabled: boolean;
  suburbanEnabled: boolean;
  outsideEnabled: boolean;
};

function taka(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

function deliveryChargeLine(rates: StoreDeliveryRates) {
  const parts = [
    rates.insideEnabled ? `ঢাকার ভেতরে ${taka(rates.insideDhaka)}` : null,
    rates.suburbanEnabled ? `ঢাকার শহরতলি ${taka(rates.dhakaSuburban)}` : null,
    rates.outsideEnabled ? `ঢাকার বাইরে ${taka(rates.outsideDhaka)}` : null,
  ].filter((part) => part != null);
  if (parts.length === 0) return "এখন ডেলিভারি বন্ধ।";
  return `${parts.join(", ")}। ঢাকায় ২৪-৪৮ ঘণ্টা, বাইরে ২৪-৭২ ঘণ্টা।`;
}

function deliveryBlocks(rates: StoreDeliveryRates | null) {
  return [
    {
      icon: "payments",
      title: "ক্যাশ অন ডেলিভারি",
      description:
        "প্রোডাক্ট হাতে পাওয়ার পর টাকা পরিশোধ করুন। আগে থেকে পেমেন্টের প্রয়োজন নেই।",
    },
    {
      icon: "local_shipping",
      title: "সারাদেশে ডেলিভারি",
      description: rates
        ? deliveryChargeLine(rates)
        : "ডেলিভারি চার্জ চেকআউটে ঠিকানা অনুযায়ী নিশ্চিত হবে।",
    },
    {
      icon: "assignment_return",
      title: "৩ দিনের ইজি রিটার্ন",
      description:
        "প্রোডাক্ট ড্যামেজ বা ভিন্ন হলে সহজে রিটার্ন বা রিপ্লেসমেন্ট করা যাবে।",
    },
    {
      icon: "support_agent",
      title: "কাস্টমার সাপোর্ট",
      description:
        "অর্ডার বা প্রোডাক্ট নিয়ে যেকোনো প্রশ্নে ফোন/মেসেজে সাহায্য পাবেন।",
    },
  ];
}

type ApiCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ProductCategoryId;
  category_slug?: string;
  category_name?: string;
  price: number;
  compare_at_price: number | null;
  unit_label: string;
  image_src: string;
  image_alt: string;
  badge: ProductBadge | null;
  status: ProductStatus;
  featured: boolean;
  has_variants?: boolean;
};

function media(src: string) {
  const value = src.trim();
  if (!value || value.includes("..") || value.startsWith("//")) return "";
  if (value.startsWith("/")) {
    return value.startsWith("/media/") ? `${API}${value}` : value;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.href;
  } catch {
    return "";
  }
}

function money(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

export function catalogProductId(id: string) {
  return isCatalogProductId(id) ? id : undefined;
}

export class CatalogUnavailableError extends Error {
  constructor() {
    super("Catalog unavailable");
    this.name = "CatalogUnavailableError";
  }
}

export type CatalogLoad = {
  products: Product[];
  unavailable: boolean;
};

function mapCard(item: ApiCard): Product {
  const imageSrc = media(item.image_src);
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle,
    price: item.price,
    compareAtPrice: item.compare_at_price ?? undefined,
    unitLabel: item.unit_label || undefined,
    imageSrc,
    imageAlt: item.image_alt || item.title,
    badge: item.badge ?? undefined,
    status: item.status,
    categoryId: item.category,
    categorySlug: item.category_slug || item.category,
    categoryName: item.category_name || undefined,
    featured: item.featured,
    hasVariants: item.has_variants === true,
  };
}

function mapDetail(
  item: NonNullable<ReturnType<typeof normalizeProductDetail>>,
  rates: StoreDeliveryRates | null,
): ProductDetail {
  const card = mapCard(item);
  const gallery = (
    item.gallery.length > 0
      ? item.gallery
      : [{ src: item.image_src, alt: item.image_alt }]
  )
    .filter((image) => image.src)
    .map((image) => ({
      src: media(image.src),
      alt: image.alt || item.title,
      type: "image" as const,
    }));
  const delivery =
    item.status === "coming-soon"
      ? [
          {
            icon: "notifications",
            title: "শীঘ্রই স্টকে আসছে",
            description: "লঞ্চ হওয়ার সাথে সাথে এই পেজে অর্ডার অপশন চালু হবে।",
          },
          ...deliveryBlocks(rates),
        ]
      : deliveryBlocks(rates);

  return {
    ...card,
    breadcrumbs: [
      { label: "হোম", href: "/" },
      ...(item.category_path.length > 0
        ? item.category_path.map((crumb) => ({
            label: crumb.name,
            href: `/products?category=${crumb.slug}`,
          }))
        : [
            {
              label: categoryLabel(item.category, item.category_name),
              href: `/products?category=${item.category}`,
            },
          ]),
      { label: item.title },
    ],
    categoryPath: item.category_path,
    gallery: gallery.filter((image) => image.src),
    tagline: item.tagline,
    stockLabel: item.stock_label,
    description: item.description,
    keyFeatures: item.highlights,
    suitableFor: item.suitable_for,
    whatsInBox: item.package_items,
    howToUse: item.how_to_use,
    faqs: item.faqs,
    variants: item.variants,
    minPerOrder: item.min_per_order,
    maxPerOrder: item.max_per_order,
    purchaseOptions: (item.options ?? [])
      .filter((group) => group.values.length > 0)
      .map((group) => ({
        id: group.id,
        name: group.name,
        kind:
          group.kind === "color" || group.kind === "size" ? group.kind : "text",
        values: group.values.map((value) => ({
          id: value.id,
          label: value.label,
          swatch: value.swatch,
        })),
      })),
    materialDetails: item.specs.map((spec) => ({
      label: spec.label,
      value: spec.value,
      group: SPEC_GROUPS.has(spec.group as ProductSpecGroupId)
        ? (spec.group as ProductSpecGroupId)
        : "general",
    })),
    delivery,
    details: {
      heading: item.story_heading,
      body: item.story_body,
      bullets: item.story_bullets,
      authenticity: {
        title: item.quality_title,
        body: item.quality_body,
        imageSrc: media(item.quality_image_src),
        imageAlt: item.quality_image_alt || item.title,
      },
    },
    related: item.related.map((related) => {
      const mapped = mapCard(related);
      return {
        id: mapped.id,
        slug: mapped.slug,
        title: mapped.title,
        priceLabel: `${mapped.hasVariants ? "শুরু " : ""}${money(mapped.price)}`,
        hasVariants: mapped.hasVariants,
        imageSrc: mapped.imageSrc,
        imageAlt: mapped.imageAlt,
        status: mapped.status,
      };
    }),
  };
}

type CatalogFetch =
  | { kind: "ok"; body: unknown }
  | { kind: "missing" }
  | { kind: "down" };

async function fetchCatalog(path: string): Promise<CatalogFetch> {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const kind = catalogResponseKind(response.status);
    if (kind === "missing") return { kind: "missing" };
    if (kind === "down") return { kind: "down" };
    return { kind: "ok", body: await response.json() };
  } catch (error) {
    console.error(
      "Catalog request failed",
      error instanceof Error ? error.name : "Error",
    );
    return { kind: "down" };
  }
}

async function readJson(path: string): Promise<unknown | null> {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function toProduct(card: PublicCatalogCard): Product {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    subtitle: card.subtitle,
    price: card.price,
    compareAtPrice: card.compareAtPrice,
    unitLabel: card.unitLabel || undefined,
    imageSrc: media(card.imageSrc),
    imageAlt: card.imageAlt || card.title,
    badge: card.badge,
    status: card.status,
    categoryId: card.category,
    categorySlug: card.categorySlug,
    categoryName: card.categoryName || undefined,
    featured: card.featured,
    hasVariants: card.hasVariants,
  };
}

function unavailableCatalog(search: CatalogSearch): CatalogPageData {
  return {
    products: [],
    total: 0,
    page: search.page,
    pages: 0,
    unavailable: true,
    searchTruncated: false,
    ...emptyCatalogCounts(),
  };
}

async function fetchCatalogPage(
  search: CatalogSearch,
  page: number,
  pageSize: number,
) {
  const params = toApiSearchParams(search, { page, pageSize });
  const body = await readJson(`/api/v1/products?${params}`);
  if (!body) return null;
  return interpretPublicCatalog(body);
}

/**
 * Every published product, for the homepage rails and the sitemap.
 * `/products` does not use this. It queries one filtered page instead.
 * The public API already excludes unpublished rows. Names are never filtered here.
 */
export const loadStoreCatalog = cache(async (): Promise<CatalogLoad> => {
  const all: Product[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages && page <= 20) {
    const body = await readJson(`/api/v1/products?page=${page}&page_size=48`);
    if (!body) return { products: [], unavailable: true };
    const parsed = interpretPublicCatalog(body);
    if (!parsed) return { products: [], unavailable: true };
    for (const item of parsed.items) all.push(toProduct(item));
    pages = parsed.pages || 1;
    if (parsed.pages === 0) break;
    page += 1;
  }
  return { products: all, unavailable: false };
});

/** One public catalog page. No admin token, no seed products, no client prices. */
export const queryStoreCatalog = cache(
  async (search: CatalogSearch): Promise<CatalogPageData> => {
    if (search.statuses.length === 0) {
      return {
        products: [],
        total: 0,
        page: 1,
        pages: 0,
        unavailable: false,
        searchTruncated: false,
        ...emptyCatalogCounts(),
      };
    }

    if (search.q) {
      const matches: Product[] = [];
      let apiPage = 1;
      let apiPages = 1;
      while (apiPage <= apiPages && apiPage <= CATALOG_SEARCH_SCAN_PAGES) {
        const parsed = await fetchCatalogPage(
          search,
          apiPage,
          CATALOG_SEARCH_PAGE_SIZE,
        );
        if (!parsed) return unavailableCatalog(search);
        for (const item of parsed.items) {
          const product = toProduct(item);
          if (matchesCatalogText(product, search.q)) matches.push(product);
        }
        apiPages = parsed.pages;
        if (parsed.pages === 0) break;
        apiPage += 1;
      }
      const page = paginateMatches(matches, search.page, CATALOG_PAGE_SIZE);
      const counts = emptyCatalogCounts();
      for (const product of matches) {
        counts.categoryCounts[product.categoryId] = (counts.categoryCounts[product.categoryId] ?? 0) + 1;
        counts.availabilityCounts[product.status] += 1;
      }
      return {
        products: page.items,
        total: page.total,
        page: page.page,
        pages: page.pages,
        unavailable: false,
        searchTruncated: apiPages > CATALOG_SEARCH_SCAN_PAGES,
        ...counts,
      };
    }

    const parsed = await fetchCatalogPage(
      search,
      search.page,
      CATALOG_PAGE_SIZE,
    );
    if (!parsed) return unavailableCatalog(search);
    return {
      products: parsed.items.map(toProduct),
      total: parsed.total,
      page: parsed.page || search.page,
      pages: parsed.pages,
      unavailable: false,
      searchTruncated: false,
      categoryCounts: parsed.categoryCounts,
      availabilityCounts: parsed.availabilityCounts,
    };
  },
);

export const listStoreProducts = cache(async (): Promise<Product[]> => {
  return (await loadStoreCatalog()).products;
});

async function loadStoreProduct(path: string): Promise<ProductDetail | null> {
  // One lookup; the API answers 404 for missing, unpublished and hidden-category alike.
  const result = await fetchCatalog(path);
  if (result.kind === "missing") return null;
  if (result.kind === "down") throw new CatalogUnavailableError();
  const detail = normalizeProductDetail(result.body);
  if (!detail) {
    console.error("Product detail response was not usable");
    throw new CatalogUnavailableError();
  }
  if (!catalogProductId(detail.id)) return null;
  return mapDetail(detail, await getStoreDeliveryRates());
}

/** Legacy slug lookup. The page redirects to the canonical id URL. */
export const getStoreProduct = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const safeSlug = normalizeProductSlug(slug);
    if (!safeSlug) return null;
    const product = await loadStoreProduct(
      `/api/v1/products/by-slug/${encodeURIComponent(safeSlug)}`,
    );
    return product && product.slug === safeSlug ? product : null;
  },
);

/** Canonical lookup by the stable product id (UUID). */
export const getStoreProductById = cache(
  async (id: string): Promise<ProductDetail | null> => {
    if (!isCatalogProductId(id)) return null;
    const lower = id.toLowerCase();
    const product = await loadStoreProduct(`/api/v1/products/${lower}`);
    return product && product.id.toLowerCase() === lower ? product : null;
  },
);

export const getStoreDeliveryRates = cache(
  async (): Promise<StoreDeliveryRates | null> => {
    const body = (await readJson("/api/v1/delivery")) as {
      inside_dhaka?: number;
      dhaka_suburban?: number;
      outside_dhaka?: number;
      inside_enabled?: boolean;
      suburban_enabled?: boolean;
      outside_enabled?: boolean;
    } | null;
    if (
      typeof body?.inside_dhaka !== "number" ||
      typeof body.dhaka_suburban !== "number" ||
      typeof body.outside_dhaka !== "number"
    ) {
      return null;
    }
    return {
      insideDhaka: body.inside_dhaka,
      dhakaSuburban: body.dhaka_suburban,
      outsideDhaka: body.outside_dhaka,
      insideEnabled: body.inside_enabled ?? true,
      suburbanEnabled: body.suburban_enabled ?? true,
      outsideEnabled: body.outside_enabled ?? true,
    };
  },
);
