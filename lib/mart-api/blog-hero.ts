import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type BlogHero = {
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  countLabel: string;
};

type ApiHero = {
  is_active?: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  count_label?: string;
};

function toHero(body: ApiHero, active: boolean): BlogHero {
  return {
    isActive: active,
    eyebrow: body.eyebrow ?? "",
    title: body.title,
    subtitle: body.subtitle ?? "",
    countLabel: body.count_label ?? "",
  };
}

function toBody(hero: BlogHero) {
  return {
    is_active: hero.isActive,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    count_label: hero.countLabel,
  };
}

export async function getBlogHero(): Promise<BlogHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/hero");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the hero."));
  }
  const body = (await response.json()) as ApiHero;
  return toHero(body, body.is_active !== false);
}

export async function saveBlogHero(hero: BlogHero): Promise<BlogHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/hero", {
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

export async function listPublicBlogHero(): Promise<BlogHero | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/hero`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiHero;
    if (!body.title.trim()) return toHero({ ...body, title: "" }, false);
    return toHero(body, true);
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
