import { WHATSAPP_HREF } from "@/app/(client)/_data/contact/contact";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ContactHeroLink = {
  label: string;
  href: string;
};

export type ContactHero = {
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: ContactHeroLink;
  secondaryCta: ContactHeroLink;
};

type ApiLink = { label?: string; href?: string };
type ApiHero = {
  is_active?: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primary_cta?: ApiLink;
  secondary_cta?: ApiLink;
};

export const FALLBACK_CONTACT_HERO: ContactHero = {
  isActive: true,
  eyebrow: "যোগাযোগ",
  title: "অর্ডার বা প্রোডাক্ট নিয়ে সাহায্য লাগলে বলুন",
  subtitle:
    "কল বা হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করুন। কর্মঘণ্টায় রিপ্লাই দেওয়ার চেষ্টা করি।",
  primaryCta: { label: "হোয়াটসঅ্যাপ", href: WHATSAPP_HREF },
  secondaryCta: { label: "কল করুন", href: "tel:+8801516527932" },
};

const HIDDEN: ContactHero = {
  isActive: false,
  eyebrow: "",
  title: "",
  subtitle: "",
  primaryCta: { label: "", href: "" },
  secondaryCta: { label: "", href: "" },
};

function link(body: ApiLink | undefined): ContactHeroLink {
  return { label: body?.label ?? "", href: body?.href ?? "" };
}

function toHero(body: ApiHero, active: boolean): ContactHero {
  return {
    isActive: active,
    eyebrow: body.eyebrow ?? "",
    title: body.title,
    subtitle: body.subtitle ?? "",
    primaryCta: link(body.primary_cta),
    secondaryCta: link(body.secondary_cta),
  };
}

function toBody(hero: ContactHero) {
  return {
    is_active: hero.isActive,
    eyebrow: hero.eyebrow,
    title: hero.title,
    subtitle: hero.subtitle,
    primary_cta: hero.primaryCta,
    secondary_cta: hero.secondaryCta,
  };
}

export async function getContactHero(): Promise<ContactHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/hero");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the hero."));
  }
  const body = (await response.json()) as ApiHero;
  return toHero(body, body.is_active !== false);
}

export async function saveContactHero(hero: ContactHero): Promise<ContactHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/hero", {
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

export async function listPublicContactHero(): Promise<ContactHero | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/contact/hero`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiHero;
    if (!body.title.trim()) return HIDDEN;
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
  if (response.status === 401) return "Sign in again to edit the contact page.";
  return fallback;
}
