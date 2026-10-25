import { cache } from "react";

import {
  MART_API_URL,
  MartApiError,
  authorizedFetch,
  fileFromSrc,
  isLocalImage,
  mediaUrl,
  sitePath,
} from "@/lib/mart-api/products";
import {
  flattenApiTree,
  parentIdField,
  type ApiTreeNode,
} from "@/lib/mart-api/category-tree";

export type CategoryRef = { id: string; slug: string; name: string };

/**
 * One category, in the flat parent-pointer shape shared by the storefront menu and the admin
 * tree. Public rows only carry the fields the storefront needs; the admin fields default.
 */
export type CategoryTile = {
  id: string;
  /** Parent category id; null means a top-level category. */
  parentId: string | null;
  slug: string;
  label: string;
  /** Storefront listing for this category (includes its subcategories). */
  href: string;
  imageSrc: string;
  isActive: boolean;
  description: string;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  /** 1 for a top-level category. */
  depth: number;
  childCount: number;
  /** Published products in the subtree (public) / assigned directly (admin). */
  productCount: number;
  /** Admin only: products in the subtree, all states. */
  subtreeProductCount: number;
  /** False when this node or an ancestor is inactive (hidden on the storefront). */
  visible: boolean;
  path: CategoryRef[];
};

export type CategoryDraft = {
  parentId: string | null;
  label: string;
  /** Empty = generated from the name by the API. */
  slug: string;
  description: string;
  imageSrc: string;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
};

export type CategorySection = {
  heading: string;
  tiles: CategoryTile[];
};

type ApiAdminCategory = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string;
  image_src: string;
  is_active: boolean;
  sort_order: number;
  meta_title: string;
  meta_description: string;
  depth: number;
  child_count: number;
  product_count: number;
  subtree_product_count: number;
  visible: boolean;
  path: CategoryRef[];
};

type ApiHeading = { heading: string };

export const categoryHref = (slug: string) => `/products?category=${encodeURIComponent(slug)}`;

/** Shown only when the API cannot be reached: plain links, never invented products. */
export const FALLBACK_CATEGORIES: CategorySection = {
  heading: "Categories",
  tiles: [],
};

export function blankCategoryDraft(parentId: string | null = null): CategoryDraft {
  return {
    parentId,
    label: "",
    slug: "",
    description: "",
    imageSrc: "",
    isActive: true,
    metaTitle: "",
    metaDescription: "",
  };
}

export function categoryImage(src: string) {
  return mediaUrl(src);
}

function toTile(body: ApiAdminCategory): CategoryTile {
  return {
    id: body.id,
    parentId: body.parent_id ?? null,
    slug: body.slug,
    label: body.name,
    href: categoryHref(body.slug),
    imageSrc: body.image_src,
    isActive: body.is_active !== false,
    description: body.description ?? "",
    sortOrder: body.sort_order ?? 0,
    metaTitle: body.meta_title ?? "",
    metaDescription: body.meta_description ?? "",
    depth: body.depth ?? 1,
    childCount: body.child_count ?? 0,
    productCount: body.product_count ?? 0,
    subtreeProductCount: body.subtree_product_count ?? 0,
    visible: body.visible !== false,
    path: body.path ?? [],
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit categories.";
  return fallback;
}

async function categoryForm(draft: CategoryDraft, previousParentId: string | null = null) {
  const local = isLocalImage(draft.imageSrc);
  const body = new FormData();
  body.set(
    "payload",
    JSON.stringify({
      ...parentIdField(draft.parentId, previousParentId),
      name: draft.label,
      ...(draft.slug.trim() ? { slug: draft.slug.trim() } : {}),
      description: draft.description,
      image_src: local ? "" : sitePath(draft.imageSrc),
      is_active: draft.isActive,
      meta_title: draft.metaTitle,
      meta_description: draft.metaDescription,
    }),
  );
  if (local) body.set("image", await fileFromSrc(draft.imageSrc, "category"));
  return body;
}

/* ---------------------------------- admin ---------------------------------- */

export async function listAdminCategories(): Promise<CategoryTile[]> {
  const response = await authorizedFetch("/api/v1/admin/categories");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load categories."));
  }
  const body = (await response.json()) as { items: ApiAdminCategory[] };
  return body.items.map(toTile);
}

/** The home page heading (CMS copy) plus every category, hidden ones included. */
export async function getCategorySection(): Promise<CategorySection> {
  const [tiles, heading] = await Promise.all([
    listAdminCategories(),
    authorizedFetch("/api/v1/admin/home/categories").then(async (response) => {
      if (!response.ok) return "Categories";
      return ((await response.json()) as ApiHeading).heading;
    }),
  ]);
  return { heading, tiles };
}

export async function updateCategoryHeading(heading: string): Promise<string> {
  const response = await authorizedFetch("/api/v1/admin/home/categories", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heading }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the heading."));
  }
  return ((await response.json()) as ApiHeading).heading;
}

export async function createCategory(draft: CategoryDraft): Promise<CategoryTile> {
  const response = await authorizedFetch("/api/v1/admin/categories", {
    method: "POST",
    body: await categoryForm(draft),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the category."));
  }
  return toTile((await response.json()) as ApiAdminCategory);
}

export async function updateCategory(
  id: string,
  draft: CategoryDraft,
  previousParentId: string | null = null,
): Promise<CategoryTile> {
  const response = await authorizedFetch(`/api/v1/admin/categories/${id}`, {
    method: "PATCH",
    body: await categoryForm(draft, previousParentId),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the category."));
  }
  return toTile((await response.json()) as ApiAdminCategory);
}

/** `reassignTo` moves subcategories and products to another category instead of refusing. */
export async function deleteCategory(id: string, reassignTo: string | null = null) {
  const query = reassignTo ? `?reassign_to=${encodeURIComponent(reassignTo)}` : "";
  const response = await authorizedFetch(`/api/v1/admin/categories/${id}${query}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the category."));
  }
}

export async function reorderCategories(
  parentId: string | null,
  ids: string[],
): Promise<CategoryTile[]> {
  const response = await authorizedFetch("/api/v1/admin/categories/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parent_id: parentId, ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the categories."));
  }
  const body = (await response.json()) as { items: ApiAdminCategory[] };
  return body.items.map(toTile);
}

/* ---------------------------------- public ---------------------------------- */

function publicTile(item: ReturnType<typeof flattenApiTree>[number]): CategoryTile {
  return {
    id: item.id,
    parentId: item.parentId,
    slug: item.slug,
    label: item.name,
    href: categoryHref(item.slug),
    imageSrc: categoryImage(item.imageSrc),
    isActive: true,
    description: item.description,
    sortOrder: 0,
    metaTitle: "",
    metaDescription: "",
    depth: item.depth,
    childCount: 0,
    productCount: item.productCount,
    subtreeProductCount: item.productCount,
    visible: true,
    path: [],
  };
}

/**
 * The storefront category tree, flattened depth-first (parents first). One request per
 * server render: `cache()` dedupes the header, hero and listing page inside the same render
 * pass, and `no-store` means there is no cross-request copy (no KV/ISR write path) that could
 * show a tree an admin has since changed. The API answers from a single indexed query.
 * Returns null when the API is unreachable so callers can show an error state.
 */
export const listPublicCategoryTree = cache(async (): Promise<CategoryTile[] | null> => {
  try {
    const response = await fetch(`${MART_API_URL}/api/v1/categories/tree`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { items?: ApiTreeNode[] };
    const flat = flattenApiTree(body.items ?? []);
    const children = new Map<string, number>();
    for (const item of flat) {
      if (item.parentId) children.set(item.parentId, (children.get(item.parentId) ?? 0) + 1);
    }
    return flat.map((item) => ({ ...publicTile(item), childCount: children.get(item.id) ?? 0 }));
  } catch {
    return null;
  }
});

const listPublicHeading = cache(async (): Promise<string> => {
  try {
    const response = await fetch(`${MART_API_URL}/api/v1/home/categories`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return FALLBACK_CATEGORIES.heading;
    return ((await response.json()) as ApiHeading).heading || FALLBACK_CATEGORIES.heading;
  } catch {
    return FALLBACK_CATEGORIES.heading;
  }
});

/** Home page rail data. Null means the category API failed (the rail shows its error state). */
export async function listPublicCategories(): Promise<CategorySection | null> {
  const [tiles, heading] = await Promise.all([listPublicCategoryTree(), listPublicHeading()]);
  return tiles ? { heading, tiles } : null;
}
