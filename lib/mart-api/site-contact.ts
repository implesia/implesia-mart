import { unstable_rethrow } from "next/navigation";

import { API_BASE_URL } from "@/lib/mart-api/media-url";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";
import {
  DEFAULT_SITE_CONTACT,
  normalizePhoneInput,
  siteContactFrom,
  type SiteContact,
} from "@/lib/site-contact";

export type SiteContactAdmin = SiteContact & { isDefault: boolean };

const ADMIN_URL = "/api/v1/admin/site/contact";

/**
 * The live central contact. Always fresh from the API (`no-store`); falls back to the
 * built-in contact when the API fails so the storefront never loses its buttons.
 */
export async function getPublicSiteContact(): Promise<SiteContact> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/site/contact`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return DEFAULT_SITE_CONTACT;
    return siteContactFrom(await response.json());
  } catch (error) {
    unstable_rethrow(error);
    return DEFAULT_SITE_CONTACT;
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the contact settings.";
  if (response.status === 403) return "Your account cannot edit the contact settings.";
  return fallback;
}

function toAdmin(body: unknown): SiteContactAdmin {
  const isDefault = (body as { is_default?: unknown } | null)?.is_default === true;
  return { ...siteContactFrom(body), isDefault };
}

export async function getAdminSiteContact(): Promise<SiteContactAdmin> {
  const response = await authorizedFetch(ADMIN_URL);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load the contact settings."));
  return toAdmin(await response.json());
}

export async function saveSiteContact(draft: {
  phone: string;
  whatsapp: string;
  email: string;
}): Promise<SiteContactAdmin> {
  const phone = normalizePhoneInput(draft.phone);
  const whatsapp = normalizePhoneInput(draft.whatsapp);
  const response = await authorizedFetch(ADMIN_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: phone ?? draft.phone,
      whatsapp: whatsapp ?? draft.whatsapp,
      email: draft.email.trim(),
    }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not save the contact settings."));
  return toAdmin(await response.json());
}
