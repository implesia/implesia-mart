import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type PrivacyHero = {
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  updatedLabel: string;
  lastUpdated: string;
};

type ApiHero = {
  is_active?: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  updated_label?: string;
  last_updated?: string;
};

function toHero(body: ApiHero, active: boolean): PrivacyHero {
  return {
    isActive: active,
    eyebrow: body.eyebrow ?? "",
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    updatedLabel: body.updated_label ?? "",
    lastUpdated: body.last_updated ?? "",
  };
}

function toBody(hero: PrivacyHero) {
  return {
    is_active: hero.isActive,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    updated_label: hero.updatedLabel,
    last_updated: hero.lastUpdated,
  };
}

export async function getPrivacyHero(): Promise<PrivacyHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/hero");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the hero."));
  }
  const body = (await response.json()) as ApiHero;
  return toHero(body, body.is_active !== false);
}

export async function savePrivacyHero(hero: PrivacyHero): Promise<PrivacyHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/hero", {
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

export async function listPublicPrivacyHero(): Promise<PrivacyHero | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/privacy/hero`, {
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
  if (response.status === 401) return "Sign in again to edit the privacy page.";
  return fallback;
}
