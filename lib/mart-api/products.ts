import type { ProductCategoryId } from "@/app/(client)/_data/products/products";
import type { ProductSpecGroupId } from "@/app/(client)/_data/products/product-details";
import {
  emptyProductContent,
  type ProductStorefrontContent,
} from "@/lib/mart-mock/product-content";
import {
  clearSession,
  readSession,
  writeSession,
  type AdminProduct,
  type ProductDraft,
  type StockStatus,
} from "@/lib/mart-mock/store";

export const MART_API_URL =
  process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

type ApiErrorBody = {
  error?: { message?: string; details?: unknown };
};

export class MartApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MartApiError";
  }
}

export type SavedProduct = {
  id: string;
  slug: string;
  image_src: string;
  content?: {
    image_alt?: string;
    gallery?: { id?: string; src?: string; alt?: string }[];
  };
};

export function mediaUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("/media/")) return `${MART_API_URL}${src}`;
  return src;
}

export function withSavedMedia(draft: ProductDraft, saved: SavedProduct): ProductDraft {
  const gallery = saved.content?.gallery ?? [];
  return {
    ...draft,
    imageSrc: mediaUrl(saved.image_src) || draft.imageSrc,
    content: {
      ...draft.content,
      imageAlt: saved.content?.image_alt || draft.content.imageAlt,
      gallery: gallery
        .filter((item) => item.src)
        .map((item, index) => ({
          id: item.id || `gallery-${index + 1}`,
          src: mediaUrl(item.src ?? ""),
          alt: item.alt ?? "",
        })),
    },
  };
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken() {
  const session = readSession();
  if (!session?.refreshToken) return false;
  let response: Response;
  try {
    response = await fetch(`${MART_API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
  } catch {
    return false;
  }
  if (!response.ok) return false;
  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!body.access_token || !body.refresh_token) return false;
  writeSession(session.email, body.access_token, body.refresh_token);
  return true;
}

function refreshOnce() {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Sends an API request and replaces an expired access token before retrying once. */
export async function authorizedFetch(path: string, init?: RequestInit, attempt = 0) {
  const headers = new Headers(init?.headers);
  const access = readSession()?.accessToken;
  if (access) headers.set("Authorization", `Bearer ${access}`);

  let response: Response;
  try {
    response = await fetch(`${MART_API_URL}${path}`, { ...init, headers });
  } catch {
    throw new MartApiError("Could not reach the API.");
  }

  if (response.status !== 401 || attempt > 0 || !readSession()) return response;
  const refreshed = await refreshOnce();
  if (!refreshed) {
    clearSession();
    return response;
  }
  return authorizedFetch(path, init, attempt + 1);
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.error?.message) return body.error.message;
  } catch {
    /* The body is not the API error envelope. */
  }
  if (response.status === 401) return "Sign in again to manage products.";
  return fallback;
}

function isLocalImage(src: string) {
  return src.startsWith("/uploads/") || src.startsWith("blob:");
}

function sitePath(src: string) {
  if (src.startsWith(`${MART_API_URL}/`)) return src.slice(MART_API_URL.length);
  return src;
}

async function fileFromSrc(src: string, name: string) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new MartApiError("Could not read an image. Upload it again.");
  }
  const blob = await response.blob();
  if (blob.type === "image/avif") {
    throw new MartApiError("Use a JPG, PNG, WEBP, or GIF image.");
  }
  const extension = blob.type.split("/")[1] || "jpg";
  return new File([blob], `${name}.${extension}`, {
    type: blob.type || "image/jpeg",
  });
}

type StoredContent = ProductStorefrontContent & {
  qualityImageSrc?: string;
  qualityImageAlt?: string;
};

function contentPayload(content: ProductStorefrontContent) {
  const stored = content as StoredContent;
  return {
    tagline: content.tagline,
    description: content.description,
    stock_label: content.stockLabel,
    unit_label: content.unitLabel,
    image_alt: content.imageAlt,
    quality_image_src: sitePath(stored.qualityImageSrc ?? ""),
    quality_image_alt: stored.qualityImageAlt ?? "",
    gallery: content.gallery
      .filter((item) => item.src && !isLocalImage(item.src))
      .map((item) => ({ id: item.id, src: sitePath(item.src), alt: item.alt })),
    highlights: content.highlights,
    suitable_for: content.suitableFor,
    package_items: content.packageItems,
    how_to_use: content.howToUse,
    story_heading: content.storyHeading,
    story_body: content.storyBody,
    story_bullets: content.storyBullets,
    quality_title: content.qualityTitle,
    quality_body: content.qualityBody,
    specs: content.specs.map((row) => ({
      id: row.id,
      label: row.label,
      value: row.value,
      group: row.group,
    })),
    faqs: content.faqs.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
    })),
    options: content.options.map((group) => ({
      id: group.id,
      name: group.name,
      kind: group.kind,
      values: group.values.map((value) => ({
        id: value.id,
        label: value.label,
        swatch: value.swatch,
      })),
    })),
  };
}

function productFields(draft: ProductDraft, sendMainFile: boolean) {
  return {
    title: draft.title,
    subtitle: draft.subtitle,
    category: draft.categoryId,
    price: draft.price,
    compare_at_price: draft.compareAtPrice,
    quantity: draft.quantity,
    status: draft.status,
    badge: draft.badge,
    image_src: sendMainFile ? "" : sitePath(draft.imageSrc),
    featured: draft.featured,
    published: draft.published,
    content: contentPayload(draft.content),
  };
}

async function imageParts(draft: ProductDraft) {
  const files: File[] = [];
  const alts: string[] = [];
  const mainIsFile = isLocalImage(draft.imageSrc);
  if (mainIsFile) {
    files.push(await fileFromSrc(draft.imageSrc, "image"));
    alts.push(draft.content.imageAlt || draft.title);
  }
  for (const [index, item] of draft.content.gallery.entries()) {
    if (!isLocalImage(item.src)) continue;
    files.push(await fileFromSrc(item.src, `gallery-${index + 1}`));
    alts.push(item.alt);
  }
  if (files.length > 12) {
    throw new MartApiError("A product can have at most 12 uploaded images.");
  }
  return { files, alts, mainIsFile };
}

function formDataFor(
  payload: Record<string, unknown>,
  files: File[],
  alts: string[],
) {
  const body = new FormData();
  body.set("payload", JSON.stringify(payload));
  body.set("image_alts", JSON.stringify(alts));
  body.set("quality_image_alt", "");
  for (const file of files) body.append("images", file);
  return body;
}

async function sendProduct(path: string, method: "POST" | "PATCH", body: FormData) {
  if (!readSession()?.accessToken) {
    throw new MartApiError("Sign in again to manage products.");
  }
  const response = await authorizedFetch(path, { method, body });
  if (!response.ok) throw new MartApiError(await readError(response, "The product could not be saved."));
  return (await response.json()) as SavedProduct;
}

export async function loginMart(email: string, password: string) {
  let response: Response;
  try {
    response = await fetch(`${MART_API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new MartApiError("Could not reach the product API.");
  }
  if (!response.ok) throw new MartApiError(await readError(response, "Sign in failed."));
  const body = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!body.access_token || !body.refresh_token) throw new MartApiError("Sign in failed.");
  return { accessToken: body.access_token, refreshToken: body.refresh_token };
}

export async function saveMartProduct(productId: string | undefined, draft: ProductDraft) {
  const { files, alts, mainIsFile } = await imageParts(draft);
  const fields = productFields(draft, mainIsFile);
  const payload = productId ? fields : { ...fields, slug: null };
  const body = formDataFor(payload, files, alts);
  if (productId) {
    return sendProduct(`/api/v1/admin/products/${productId}`, "PATCH", body);
  }
  return sendProduct("/api/v1/admin/products", "POST", body);
}

const SPEC_GROUPS = new Set<string>([
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

type ApiGallery = { id?: string; src?: string; alt?: string };
type ApiSpec = { id?: string; label?: string; value?: string; group?: string };
type ApiFaq = { id?: string; question?: string; answer?: string };
type ApiOptionValue = { id?: string; label?: string; swatch?: string };
type ApiOption = {
  id?: string;
  name?: string;
  kind?: string;
  values?: ApiOptionValue[];
};
type ApiContent = {
  tagline?: string;
  description?: string;
  stock_label?: string;
  unit_label?: string;
  image_alt?: string;
  quality_image_src?: string;
  quality_image_alt?: string;
  gallery?: ApiGallery[];
  highlights?: string[];
  suitable_for?: string[];
  package_items?: string[];
  how_to_use?: string[];
  story_heading?: string;
  story_body?: string;
  story_bullets?: string[];
  quality_title?: string;
  quality_body?: string;
  specs?: ApiSpec[];
  faqs?: ApiFaq[];
  options?: ApiOption[];
};

type ApiCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ProductCategoryId;
  price: number;
  compare_at_price: number | null;
  quantity: number | null;
  status: StockStatus;
  badge: AdminProduct["badge"];
  image_src: string;
  featured: boolean;
  published: boolean;
  content?: ApiContent;
};

type ApiList = {
  items: ApiCard[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  metrics: { total: number; live: number; hidden: number; sold_out: number };
  category_counts: { all: number; gadgets: number; fashion: number };
};

export type ProductListQuery = {
  q?: string;
  category?: ProductCategoryId | null;
  status?: StockStatus | null;
  visibility?: "live" | "hidden" | null;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page: number;
  pageSize?: number;
};

export type ProductListResult = {
  items: AdminProduct[];
  total: number;
  page: number;
  pages: number;
  metrics: { total: number; live: number; hidden: number; soldOut: number };
  categoryCounts: { all: number; gadgets: number; fashion: number };
};

function specGroup(value: string | undefined): ProductSpecGroupId {
  if (value && SPEC_GROUPS.has(value)) return value as ProductSpecGroupId;
  return "general";
}

function contentFromApi(content: ApiContent | undefined): ProductStorefrontContent {
  const base = emptyProductContent();
  if (!content) return base;
  const mapped: StoredContent = {
    ...base,
    tagline: content.tagline ?? "",
    description: content.description ?? "",
    stockLabel: content.stock_label || base.stockLabel,
    unitLabel: content.unit_label ?? "",
    imageAlt: content.image_alt ?? "",
    gallery: (content.gallery ?? [])
      .filter((item) => item.src)
      .map((item, index) => ({
        id: item.id || `gallery-${index + 1}`,
        src: mediaUrl(item.src ?? ""),
        alt: item.alt ?? "",
      })),
    highlights: content.highlights ?? [],
    suitableFor: content.suitable_for ?? [],
    packageItems: content.package_items ?? [],
    howToUse: content.how_to_use ?? [],
    storyHeading: content.story_heading ?? "",
    storyBody: content.story_body ?? "",
    storyBullets: content.story_bullets ?? [],
    qualityTitle: content.quality_title || base.qualityTitle,
    qualityBody: content.quality_body || base.qualityBody,
    specs: (content.specs ?? []).map((row, index) => ({
      id: row.id || `spec-${index + 1}`,
      label: row.label ?? "",
      value: row.value ?? "",
      group: specGroup(row.group),
    })),
    faqs: (content.faqs ?? []).map((row, index) => ({
      id: row.id || `faq-${index + 1}`,
      question: row.question ?? "",
      answer: row.answer ?? "",
    })),
    options: (content.options ?? [])
      .filter((group) => group.name && (group.values ?? []).some((value) => value.label))
      .map((group, index) => ({
        id: group.id || `option-${index + 1}`,
        name: group.name ?? "",
        kind: group.kind === "color" || group.kind === "size" ? group.kind : "text",
        values: (group.values ?? [])
          .filter((value) => value.label)
          .map((value, valueIndex) => ({
            id: value.id || `value-${valueIndex + 1}`,
            label: value.label ?? "",
            swatch: value.swatch ?? "",
          })),
      })),
    qualityImageSrc: mediaUrl(content.quality_image_src ?? ""),
    qualityImageAlt: content.quality_image_alt ?? "",
  };
  return mapped;
}

function cardToProduct(item: ApiCard): AdminProduct {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle,
    categoryId: item.category,
    price: item.price,
    compareAtPrice: item.compare_at_price,
    quantity: item.quantity,
    status: item.status,
    badge: item.badge,
    imageSrc: mediaUrl(item.image_src),
    featured: item.featured,
    published: item.published,
    custom: true,
    content: contentFromApi(item.content),
  };
}

async function apiFetch(path: string, init?: RequestInit) {
  if (!readSession()?.accessToken) {
    throw new MartApiError("Sign in again to manage products.");
  }
  return authorizedFetch(path, init);
}

function wholeNumber(value: string | undefined) {
  if (!value?.trim()) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return null;
  return String(number);
}

export async function listMartProducts(query: ProductListQuery): Promise<ProductListResult> {
  const search = new URLSearchParams();
  if (query.q?.trim()) search.set("q", query.q.trim());
  if (query.category) search.set("category", query.category);
  if (query.status) search.set("status", query.status);
  if (query.visibility) search.set("visibility", query.visibility);
  const minPrice = wholeNumber(query.minPrice);
  const maxPrice = wholeNumber(query.maxPrice);
  if (minPrice) search.set("min_price", minPrice);
  if (maxPrice) search.set("max_price", maxPrice);
  if (query.sort && query.sort !== "catalog") search.set("sort", query.sort);
  search.set("page", String(query.page));
  search.set("page_size", String(query.pageSize ?? 10));
  const response = await apiFetch(`/api/v1/admin/products?${search.toString()}`);
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load products."));
  }
  const body = (await response.json()) as ApiList;
  return {
    items: body.items.map(cardToProduct),
    total: body.total,
    page: body.page,
    pages: body.pages,
    metrics: {
      total: body.metrics.total,
      live: body.metrics.live,
      hidden: body.metrics.hidden,
      soldOut: body.metrics.sold_out,
    },
    categoryCounts: body.category_counts,
  };
}

export async function getMartProduct(id: string): Promise<AdminProduct> {
  const response = await apiFetch(`/api/v1/admin/products/${id}`);
  if (response.status === 404) throw new MartApiError("Product not found");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load this product."));
  }
  return cardToProduct((await response.json()) as ApiCard);
}

export async function patchMartProduct(
  id: string,
  fields: { status?: StockStatus; published?: boolean },
) {
  const body = new FormData();
  body.set("payload", JSON.stringify(fields));
  body.set("image_alts", "[]");
  body.set("quality_image_alt", "");
  const response = await apiFetch(`/api/v1/admin/products/${id}`, {
    method: "PATCH",
    body,
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "The product could not be updated."));
  }
}

export async function deleteMartProduct(id: string) {
  const response = await apiFetch(`/api/v1/admin/products/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    throw new MartApiError(await readError(response, "The product could not be deleted."));
  }
}
