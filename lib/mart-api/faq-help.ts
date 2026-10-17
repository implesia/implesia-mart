import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type FaqHelp = {
  isActive: boolean;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

type ApiHelp = {
  is_active?: boolean;
  title?: string;
  subtitle?: string;
  email?: string;
  phone?: string;
  primary_label?: string;
  primary_href?: string;
  secondary_label?: string;
  secondary_href?: string;
};

function toHelp(body: ApiHelp, active: boolean): FaqHelp {
  return {
    isActive: active,
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    primaryLabel: body.primary_label ?? "",
    primaryHref: body.primary_href ?? "",
    secondaryLabel: body.secondary_label ?? "",
    secondaryHref: body.secondary_href ?? "",
  };
}

function toBody(help: FaqHelp) {
  return {
    is_active: help.isActive,
    title: help.title,
    subtitle: help.subtitle,
    email: help.email,
    phone: help.phone,
    primary_label: help.primaryLabel,
    primary_href: help.primaryHref,
    secondary_label: help.secondaryLabel,
    secondary_href: help.secondaryHref,
  };
}

export async function getFaqHelp(): Promise<FaqHelp> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/help");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the help banner."));
  }
  const body = (await response.json()) as ApiHelp;
  return toHelp(body, body.is_active !== false);
}

export async function saveFaqHelp(help: FaqHelp): Promise<FaqHelp> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/help", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(help)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the help banner."));
  }
  const body = (await response.json()) as ApiHelp;
  return toHelp(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicFaqHelp(): Promise<FaqHelp | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/faqs/help`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const help = toHelp((await response.json()) as ApiHelp, true);
    if (!help.title.trim()) return { ...help, isActive: false };
    return help;
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
