import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type FaqCategory = {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
};

export type FaqCategories = {
  isActive: boolean;
  title: string;
  subtitle: string;
  allLabel: string;
  allIcon: string;
  navLabel: string;
  items: FaqCategory[];
};

type ApiItem = { id?: string; label?: string; icon?: string; is_active?: boolean };
type ApiCategories = {
  is_active?: boolean;
  title?: string;
  subtitle?: string;
  all_label?: string;
  all_icon?: string;
  nav_label?: string;
  items?: ApiItem[];
};

function toItem(body: ApiItem, index: number, active: boolean): FaqCategory {
  return {
    id: body.id ?? `cat-${index + 1}`,
    label: body.label ?? "",
    icon: body.icon ?? "",
    isActive: active,
  };
}

function toCategories(body: ApiCategories, active: boolean): FaqCategories {
  return {
    isActive: active,
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    allLabel: body.all_label ?? "",
    allIcon: body.all_icon ?? "",
    navLabel: body.nav_label ?? "",
    items: (body.items ?? []).map((item, index) => toItem(item, index, item.is_active !== false)),
  };
}

export function faqCategoriesHasCopy(categories: FaqCategories) {
  return Boolean(
    categories.title.trim() ||
      categories.subtitle.trim() ||
      categories.allLabel.trim() ||
      categories.allIcon.trim() ||
      categories.navLabel.trim() ||
      categories.items.some((item) => item.isActive !== false && item.label.trim()),
  );
}

function toBody(categories: FaqCategories) {
  return {
    is_active: categories.isActive,
    title: categories.title,
    subtitle: categories.subtitle,
    all_label: categories.allLabel,
    all_icon: categories.allIcon,
    nav_label: categories.navLabel,
    items: categories.items.map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      is_active: item.isActive,
    })),
  };
}

export async function getFaqCategories(): Promise<FaqCategories> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/categories");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the categories."));
  }
  const body = (await response.json()) as ApiCategories;
  return toCategories(body, body.is_active !== false);
}

export async function saveFaqCategories(categories: FaqCategories): Promise<FaqCategories> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/categories", {
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

export async function listPublicFaqCategories(): Promise<FaqCategories | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/faqs/categories`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const categories = toCategories((await response.json()) as ApiCategories, true);
    if (!faqCategoriesHasCopy(categories)) return { ...categories, isActive: false };
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
  if (response.status === 401) return "Sign in again to edit the FAQ page.";
  return fallback;
}
