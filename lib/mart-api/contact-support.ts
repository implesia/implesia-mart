import { FALLBACK_CONTACT_SUPPORT, fillContactSupport } from "@/lib/mart-api/contact-fallback";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ContactSupportHour = {
  id: string;
  label: string;
  value: string;
  isActive: boolean;
};

export type ContactSupportLink = {
  id: string;
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
};

export type ContactSupport = {
  isActive: boolean;
  title: string;
  subtitle: string;
  hours: ContactSupportHour[];
  quickLinks: ContactSupportLink[];
};

type ApiHour = { id?: string; label?: string; value?: string; is_active?: boolean };
type ApiLink = {
  id?: string;
  icon?: string;
  label?: string;
  href?: string;
  is_active?: boolean;
};
type ApiSupport = {
  is_active?: boolean;
  title: string;
  subtitle?: string;
  hours?: ApiHour[];
  quick_links?: ApiLink[];
};

function hour(body: ApiHour, index: number): ContactSupportHour {
  return {
    id: body.id ?? `hour-${index + 1}`,
    label: body.label ?? "",
    value: body.value ?? "",
    isActive: body.is_active !== false,
  };
}

function link(body: ApiLink, index: number): ContactSupportLink {
  return {
    id: body.id ?? `link-${index + 1}`,
    icon: body.icon || "help",
    label: body.label ?? "",
    href: body.href ?? "",
    isActive: body.is_active !== false,
  };
}

function toSupport(body: ApiSupport, active: boolean): ContactSupport {
  return {
    isActive: active,
    title: body.title,
    subtitle: body.subtitle ?? "",
    hours: (body.hours ?? []).map(hour),
    quickLinks: (body.quick_links ?? []).map(link),
  };
}

function toBody(support: ContactSupport) {
  return {
    is_active: support.isActive,
    title: support.title,
    subtitle: support.subtitle,
    hours: support.hours.map((item) => ({
      label: item.label,
      value: item.value,
      is_active: item.isActive,
    })),
    quick_links: support.quickLinks.map((item) => ({
      icon: item.icon,
      label: item.label,
      href: item.href,
      is_active: item.isActive,
    })),
  };
}

export async function getContactSupport(): Promise<ContactSupport> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/support");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load support."));
  }
  const body = (await response.json()) as ApiSupport;
  return toSupport(body, body.is_active !== false);
}

export async function saveContactSupport(support: ContactSupport): Promise<ContactSupport> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/support", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(support)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save support."));
  }
  const body = (await response.json()) as ApiSupport;
  return toSupport(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicContactSupport(): Promise<ContactSupport | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/contact/support`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return FALLBACK_CONTACT_SUPPORT;
    const body = (await response.json()) as ApiSupport;
    if (!body.title.trim()) return toSupport({ ...body, title: "" }, false);
    return fillContactSupport(toSupport(body, true));
  } catch {
    return FALLBACK_CONTACT_SUPPORT;
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
