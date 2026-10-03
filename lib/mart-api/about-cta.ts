import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type AboutCtaLink = {
  label: string;
  href: string;
};

export type AboutCta = {
  isActive: boolean;
  title: string;
  subtitle: string;
  primaryCta: AboutCtaLink;
  secondaryCta: AboutCtaLink;
};

type ApiLink = { label?: string; href?: string };

type ApiCta = {
  is_active?: boolean;
  title: string;
  subtitle: string;
  primary_cta?: ApiLink;
  secondary_cta?: ApiLink;
};

export const FALLBACK_ABOUT_CTA: AboutCta = {
  isActive: true,
  title: "আজই খুঁজে নিন আপনার প্রয়োজনীয় প্রোডাক্ট",
  subtitle: "গ্যাজেট হোক বা গর্জিয়াস ড্রেস — হাতে পেয়ে দেখে তারপর ক্যাশ অন ডেলিভারি।",
  primaryCta: { label: "সব প্রোডাক্ট", href: "/products" },
  secondaryCta: { label: "যোগাযোগ", href: "/contact-us" },
};

const HIDDEN: AboutCta = {
  isActive: false,
  title: "",
  subtitle: "",
  primaryCta: { label: "", href: "" },
  secondaryCta: { label: "", href: "" },
};

function link(body: ApiLink | undefined): AboutCtaLink {
  return { label: body?.label ?? "", href: body?.href ?? "" };
}

function toCta(body: ApiCta, active: boolean): AboutCta {
  return {
    isActive: active,
    title: body.title,
    subtitle: body.subtitle,
    primaryCta: link(body.primary_cta),
    secondaryCta: link(body.secondary_cta),
  };
}

function toBody(cta: AboutCta) {
  return {
    is_active: cta.isActive,
    title: cta.title,
    subtitle: cta.subtitle,
    primary_cta: cta.primaryCta,
    secondary_cta: cta.secondaryCta,
  };
}

export async function readAboutCta(): Promise<AboutCta> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/cta");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the call to action."));
  }
  const body = (await response.json()) as ApiCta;
  return toCta(body, body.is_active !== false);
}

export async function updateAboutCta(cta: AboutCta): Promise<AboutCta> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/cta", {
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

export async function listPublicAboutCta(): Promise<AboutCta | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/about/cta`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiCta;
    if (!body.title.trim()) return HIDDEN;
    return toCta(body, true);
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
  if (response.status === 401) return "Sign in again to edit the about page.";
  return fallback;
}
