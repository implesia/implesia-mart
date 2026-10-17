import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type BlogCategory = {
  id: string;
  label: string;
  isActive: boolean;
};

export type BlogCategories = {
  isActive: boolean;
  items: BlogCategory[];
};

type ApiItem = { id?: string; label?: string; is_active?: boolean };
type ApiCategories = { is_active?: boolean; items?: ApiItem[] };

function item(body: ApiItem, index: number): BlogCategory {
  return {
    id: body.id ?? `cat-${index + 1}`,
    label: body.label ?? "",
    isActive: body.is_active !== false,
  };
}

function toCategories(body: ApiCategories, active: boolean): BlogCategories {
  return { isActive: active, items: (body.items ?? []).map(item) };
}

function toBody(categories: BlogCategories) {
  return {
    is_active: categories.isActive,
    items: categories.items.map((entry) => ({
      id: entry.id,
      label: entry.label,
      is_active: entry.isActive,
    })),
  };
}

export function blogCategoryLabel(categories: BlogCategories | null, id: string) {
  return categories?.items.find((item) => item.id === id && item.isActive !== false)?.label ?? "";
}

export async function getBlogCategories(): Promise<BlogCategories> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/categories");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the categories."));
  }
  const body = (await response.json()) as ApiCategories;
  return toCategories(body, body.is_active !== false);
}

export async function saveBlogCategories(categories: BlogCategories): Promise<BlogCategories> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/categories", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(categories)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the categories."));
  }
  const body = (await response.json()) as ApiCategories;
  return toCategories(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicBlogCategories(): Promise<BlogCategories | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/categories`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiCategories;
    const categories = toCategories(body, true);
    if (categories.items.length === 0) return { isActive: false, items: [] };
    return categories;
  } catch {
    return null;
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the blog page.";
  return fallback;
}
