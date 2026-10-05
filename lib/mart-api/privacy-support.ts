import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type PrivacySupport = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

type ApiSupport = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  title?: string;
  subtitle?: string;
  email?: string;
  phone?: string;
  primary_label?: string;
  primary_href?: string;
  secondary_label?: string;
  secondary_href?: string;
};

function toSupport(body: ApiSupport, fromAdmin: boolean): PrivacySupport {
  return {
    isActive: fromAdmin ? body.is_active !== false : true,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
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

function toBody(support: PrivacySupport) {
  return {
    is_active: support.isActive,
    icon: support.icon,
    nav_label: support.navLabel,
    title: support.title,
    subtitle: support.subtitle,
    email: support.email,
    phone: support.phone,
    primary_label: support.primaryLabel,
    primary_href: support.primaryHref,
    secondary_label: support.secondaryLabel,
    secondary_href: support.secondaryHref,
  };
}

export async function getPrivacySupport(): Promise<PrivacySupport> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/support");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the contact section."));
  }
  return toSupport((await response.json()) as ApiSupport, true);
}

export async function savePrivacySupport(support: PrivacySupport): Promise<PrivacySupport> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/support", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(support)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the contact section."));
  }
  return toSupport((await response.json()) as ApiSupport, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicPrivacySupport(): Promise<PrivacySupport | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/privacy/support`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const support = toSupport((await response.json()) as ApiSupport, false);
    if (!support.title.trim()) return { ...support, isActive: false };
    return support;
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
