import { readAdminBadgeRef, type AdminBadgeRef } from "@/lib/mart-api/badge-rules";
import { publicRequestInit } from "@/lib/mart-api/public-request";
import type { ProductCategoryId } from "@/app/(client)/_data/products/products";
import type { ProductSpecGroupId } from "@/app/(client)/_data/products/product-details";
import {
  emptyProductContent,
  type ProductGalleryImage,
  type ProductStorefrontContent,
} from "@/lib/mart-mock/product-content";
import {
  clearSession,
  type AdminProduct,
  type ProductDraft,
  type StockStatus,
} from "@/lib/mart-mock/store";

export const MART_API_URL =
  process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

type ApiErrorBody = {
  error?: { message?: string; details?: unknown };
};

/** One problem from the product create API: `{field, message, fix}`, field = form field key. */
export type ApiFieldError = { field: string; message: string; fix: string };

/** `network`: the API was not reached. `server`: it answered 5xx. `request`: any other failure. */
export type MartApiErrorKind = "network" | "server" | "request";

export class MartApiError extends Error {
  readonly kind: MartApiErrorKind;
  readonly fieldErrors: ApiFieldError[];

  constructor(
    message: string,
    options: { kind?: MartApiErrorKind; fieldErrors?: ApiFieldError[] } = {},
  ) {
    super(message);
    this.name = "MartApiError";
    this.kind = options.kind ?? "request";
    this.fieldErrors = options.fieldErrors ?? [];
  }
}

/** The `errors` list of the product create API, or `[]` when the body has another shape. */
export function readFieldErrors(body: unknown): ApiFieldError[] {
  if (!body || typeof body !== "object") return [];
  const list = (body as { errors?: unknown }).errors;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { field, message, fix } = item as Record<string, unknown>;
    if (typeof field !== "string" || typeof message !== "string" || !message.trim()) return [];
    return [{ field, message, fix: typeof fix === "string" ? fix : "" }];
  });
}

export type SavedProduct = {
  id: string;
  slug: string;
  image_src: string;
  content?: {
    image_alt?: string;
    gallery?: ApiGallery[];
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
      gallery: galleryFromApi(gallery),
    },
  };
}

function galleryFromApi(items: ApiGallery[]): ProductGalleryImage[] {
  return items
    .filter((item) => item.src || item.youtube_id)
    .map((item, index) => ({
      id: item.id || `gallery-${index + 1}`,
      kind: item.kind === "video" || item.kind === "youtube" ? item.kind : "image",
      src: mediaUrl(item.src ?? ""),
      ...(item.youtube_id ? { youtubeId: item.youtube_id } : {}),
      alt: item.alt ?? "",
    }));
}

/** Admin calls go through the same-origin proxy. The browser never sees the tokens. */
export async function authorizedFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.delete("Authorization");
  let response: Response;
  try {
    response = await fetch(`/api/proxy${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new MartApiError("Could not reach the API.", { kind: "network" });
  }
  if (response.status === 401 && !path.includes("/auth/change-password")) clearSession();
  return response;
}

export { publicRequestInit } from "@/lib/mart-api/public-request";

export async function publicFetch(path: string, init?: RequestInit) {
  try {
    return await fetch(`${MART_API_URL}${path}`, publicRequestInit(init));
  } catch {
    throw new MartApiError("Could not reach the API.");
  }
}

export async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.error?.message) return body.error.message;
  } catch {
    /* The body is not the API error envelope. */
  }
  if (response.status === 401) return "Sign in again to manage products.";
  return fallback;
}

export function isLocalImage(src: string) {
  return src.startsWith("/uploads/") || src.startsWith("blob:");
}

export function sitePath(src: string) {
  if (src.startsWith(`${MART_API_URL}/`)) return src.slice(MART_API_URL.length);
  return src;
}

export async function fileFromSrc(src: string, name: string) {
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
    // New files go up as `images`/`videos` parts; the API appends them after these.
    gallery: content.gallery
      .filter((item) =>
        item.kind === "youtube" ? Boolean(item.youtubeId) : item.src && !isLocalImage(item.src),
      )
      .map((item) =>
        item.kind === "youtube"
          ? { id: item.id, kind: "youtube", youtube_id: item.youtubeId, alt: item.alt }
          : {
              id: item.id,
              kind: item.kind ?? "image",
              src: sitePath(item.src),
              alt: item.alt,
            },
      ),
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

function productFields(draft: ProductDraft, sendMainFile: boolean, updating: boolean) {
  // A product with variants has its price and stock rolled up by the API from the variants.
  // On update those are left out, so a stale page can never overwrite the live totals.
  const rolledUp = updating && Boolean(draft.variants?.length);
  const variantFields =
    draft.variants === undefined
      ? {}
      : {
          variants: draft.variants.map((variant) => ({
            ...(variant.id ? { id: variant.id } : {}),
            options: variant.options,
            sku: variant.sku,
            price: variant.price,
            compare_at_price: variant.compareAtPrice,
            quantity: variant.quantity,
            is_active: variant.isActive,
          })),
        };
  return {
    title: draft.title,
    subtitle: draft.subtitle,
    // The assigned category node; the API derives the legacy root slug from it.
    // A draft may not have a category yet; then none is sent.
    ...(draft.categoryRefId
      ? { category_id: draft.categoryRefId }
      : draft.categoryId
        ? { category: draft.categoryId }
        : {}),
    ...(rolledUp
      ? {}
      : {
          price: draft.price,
          compare_at_price: draft.compareAtPrice,
          quantity: draft.quantity,
        }),
    min_order_quantity: draft.minOrderQuantity ?? 1,
    max_order_quantity: draft.maxOrderQuantity ?? null,
    ...variantFields,
    status: draft.status,
    // `badge_ids` when the form knows the badge list; the API derives `badge` from it.
    ...(draft.badges !== undefined
      ? { badge_ids: draft.badges.map((badge) => badge.id) }
      : { badge: draft.badge }),
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
  const videos: File[] = [];
  const videoAlts: string[] = [];
  for (const [index, item] of draft.content.gallery.entries()) {
    if (item.kind === "youtube" || !isLocalImage(item.src)) continue;
    if (item.kind === "video") {
      videos.push(await videoFromSrc(item.src, `video-${index + 1}`));
      videoAlts.push(item.alt);
      continue;
    }
    files.push(await fileFromSrc(item.src, `gallery-${index + 1}`));
    alts.push(item.alt);
  }
  if (files.length > 12) {
    throw new MartApiError("A product can have at most 12 uploaded images.");
  }
  const videoBytes = videos.reduce((sum, file) => sum + file.size, 0);
  if (videoBytes > MAX_VIDEO_UPLOAD_BYTES) {
    throw new MartApiError(
      "Too many new videos to upload at once. Save with up to 100 MB of new video, then add the rest.",
    );
  }
  return { files, alts, videos, videoAlts, mainIsFile };
}

/** Per save. The admin proxy accepts a little more (see next.config.ts). */
const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;

async function videoFromSrc(src: string, name: string) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new MartApiError("Could not read a video. Upload it again.");
  }
  const blob = await response.blob();
  const extension = blob.type === "video/webm" ? "webm" : "mp4";
  return new File([blob], `${name}.${extension}`, {
    type: blob.type || `video/${extension}`,
  });
}

function formDataFor(
  payload: Record<string, unknown>,
  files: File[],
  alts: string[],
  videos: File[] = [],
  videoAlts: string[] = [],
) {
  const body = new FormData();
  body.set("payload", JSON.stringify(payload));
  body.set("image_alts", JSON.stringify(alts));
  body.set("quality_image_alt", "");
  for (const file of files) body.append("images", file);
  if (videos.length) {
    body.set("video_alts", JSON.stringify(videoAlts));
    for (const file of videos) body.append("videos", file);
  }
  return body;
}

async function sendProduct(path: string, method: "POST" | "PATCH", body: FormData) {
  const response = await authorizedFetch(path, { method, body });
  if (response.status === 401) {
    throw new MartApiError("Sign in again to manage products.");
  }
  if (!response.ok) {
    const kind = response.status >= 500 ? "server" : "request";
    let body: unknown = null;
    try {
      body = await response.clone().json();
    } catch {
      /* Not JSON (a proxy or gateway page). */
    }
    const fieldErrors = readFieldErrors(body);
    if (fieldErrors.length > 0) {
      throw new MartApiError(fieldErrors[0].message, { kind, fieldErrors });
    }
    throw new MartApiError(await readError(response, "The product could not be saved."), { kind });
  }
  return (await response.json()) as SavedProduct;
}

export async function loginMart(email: string, password: string) {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new MartApiError("Could not reach the product API.");
  }
  if (!response.ok) throw new MartApiError(await readError(response, "Sign in failed."));
  const body = (await response.json()) as { email?: string };
  if (!body.email) throw new MartApiError("Sign in failed.");
  return { email: body.email };
}

export async function changeMartPassword(currentPassword: string, newPassword: string) {
  let response: Response;
  try {
    response = await fetch("/api/proxy/api/v1/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  } catch {
    throw new MartApiError("Could not reach the API.");
  }
  if (!response.ok) {
    const message = await readError(response, "The password could not be changed.");
    if (response.status === 401 && message === "Could not validate credentials") {
      clearSession();
      throw new MartApiError("Sign in again to change your password.");
    }
    throw new MartApiError(message);
  }
}

export async function logoutMart() {
  let response: Response;
  try {
    response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    throw new MartApiError("Could not reach the API. You are still signed in.");
  }
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Sign out did not finish. You are still signed in."),
    );
  }
  clearSession();
}

export async function saveMartProduct(productId: string | undefined, draft: ProductDraft) {
  const { files, alts, videos, videoAlts, mainIsFile } = await imageParts(draft);
  const fields = productFields(draft, mainIsFile, Boolean(productId));
  const payload = productId ? fields : { ...fields, slug: null };
  const body = formDataFor(payload, files, alts, videos, videoAlts);
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

type ApiGallery = {
  id?: string;
  kind?: string;
  src?: string;
  youtube_id?: string;
  alt?: string;
};
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
  category_id?: string | null;
  category_slug?: string;
  category_name?: string;
  category_path?: { id?: string; slug: string; name: string }[];
  price: number;
  compare_at_price: number | null;
  quantity: number | null;
  status: StockStatus;
  badge: AdminProduct["badge"];
  badges?: unknown[];
  image_src: string;
  featured: boolean;
  published: boolean;
  content?: ApiContent;
  min_order_quantity?: number;
  max_order_quantity?: number | null;
  variants?: ApiVariant[];
};

type ApiVariant = {
  id: string;
  options: Record<string, string>;
  sku: string;
  price: number;
  compare_at_price: number | null;
  quantity: number | null;
  is_active: boolean;
};

type ApiList = {
  items: ApiCard[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  metrics: { total: number; live: number; hidden: number; sold_out: number };
  category_counts: Record<string, number>;
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
  categoryCounts: Record<string, number>;
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
    gallery: galleryFromApi(content.gallery ?? []),
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
    categoryRefId: item.category_id ?? undefined,
    categoryName: item.category_name,
    categoryPath: (item.category_path ?? []).map(({ slug, name }) => ({ slug, name })),
    price: item.price,
    compareAtPrice: item.compare_at_price,
    quantity: item.quantity,
    status: item.status,
    badge: item.badge,
    badges: Array.isArray(item.badges)
      ? item.badges.flatMap((badge) => {
          const ref = readAdminBadgeRef(badge);
          return ref ? [ref] : ([] as AdminBadgeRef[]);
        })
      : undefined,
    imageSrc: mediaUrl(item.image_src),
    featured: item.featured,
    published: item.published,
    custom: true,
    content: contentFromApi(item.content),
    minOrderQuantity: item.min_order_quantity ?? 1,
    maxOrderQuantity: item.max_order_quantity ?? null,
    variants: (item.variants ?? []).map((variant) => ({
      id: variant.id,
      options: variant.options,
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compare_at_price,
      quantity: variant.quantity,
      isActive: variant.is_active,
    })),
  };
}

async function apiFetch(path: string, init?: RequestInit) {
  const response = await authorizedFetch(path, init);
  if (response.status === 401) {
    throw new MartApiError("Sign in again to manage products.");
  }
  return response;
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
