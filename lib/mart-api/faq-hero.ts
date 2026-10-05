import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type FaqHeroSearch = {
  id: string;
  label: string;
  isActive: boolean;
};

export type FaqHero = {
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  searchLabel: string;
  clearLabel: string;
  trendingLabel: string;
  trending: FaqHeroSearch[];
};

type ApiSearch = { id?: string; label?: string; is_active?: boolean };
type ApiHero = {
  is_active?: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  search_label?: string;
  clear_label?: string;
  trending_label?: string;
  trending?: ApiSearch[];
};

function toSearch(body: ApiSearch, index: number, active: boolean): FaqHeroSearch {
  return {
    id: body.id ?? `search-${index + 1}`,
    label: body.label ?? "",
    isActive: active,
  };
}

function toHero(body: ApiHero, active: boolean): FaqHero {
  return {
    isActive: active,
    eyebrow: body.eyebrow ?? "",
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    placeholder: body.placeholder ?? "",
    searchLabel: body.search_label ?? "",
    clearLabel: body.clear_label ?? "",
    trendingLabel: body.trending_label ?? "",
    trending: (body.trending ?? []).map((item, index) =>
      toSearch(item, index, item.is_active !== false),
    ),
  };
}

function toBody(hero: FaqHero) {
  return {
    is_active: hero.isActive,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    placeholder: hero.placeholder,
    search_label: hero.searchLabel,
    clear_label: hero.clearLabel,
    trending_label: hero.trendingLabel,
    trending: hero.trending.map((item) => ({
      id: item.id,
      label: item.label,
      is_active: item.isActive,
    })),
  };
}

export async function getFaqHero(): Promise<FaqHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/hero");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the hero."));
  }
  const body = (await response.json()) as ApiHero;
  return toHero(body, body.is_active !== false);
}

export async function saveFaqHero(hero: FaqHero): Promise<FaqHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/hero", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(hero)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the hero."));
  }
  const body = (await response.json()) as ApiHero;
  return toHero(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicFaqHero(): Promise<FaqHero | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/faqs/hero`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const hero = toHero((await response.json()) as ApiHero, true);
    if (!hero.title.trim()) return { ...hero, isActive: false };
    return hero;
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
