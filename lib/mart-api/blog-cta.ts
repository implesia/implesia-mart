import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type BlogCta = {
  isActive: boolean;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

type ApiCta = {
  is_active?: boolean;
  title?: string;
  subtitle?: string;
  primary_label?: string;
  primary_href?: string;
  secondary_label?: string;
  secondary_href?: string;
};

function toCta(body: ApiCta, active: boolean): BlogCta {
  return {
    isActive: active,
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    primaryLabel: body.primary_label ?? "",
    primaryHref: body.primary_href ?? "",
    secondaryLabel: body.secondary_label ?? "",
    secondaryHref: body.secondary_href ?? "",
  };
}

function toBody(cta: BlogCta) {
  return {
    is_active: cta.isActive,
    title: cta.title,
    subtitle: cta.subtitle,
    primary_label: cta.primaryLabel,
    primary_href: cta.primaryHref,
    secondary_label: cta.secondaryLabel,
    secondary_href: cta.secondaryHref,
  };
}

export async function getBlogCta(): Promise<BlogCta> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/cta");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the call to action."));
  }
  const body = (await response.json()) as ApiCta;
  return toCta(body, body.is_active !== false);
}

export async function saveBlogCta(cta: BlogCta): Promise<BlogCta> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/cta", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(cta)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the call to action."));
  }
  const body = (await response.json()) as ApiCta;
  return toCta(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicBlogCta(): Promise<BlogCta | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/cta`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const cta = toCta((await response.json()) as ApiCta, true);
    if (!cta.title.trim()) return { ...cta, isActive: false };
    return cta;
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
