import { unstable_rethrow } from "next/navigation";

import {
  DEFAULT_HEADER_ITEMS,
  navItemsToShow,
  type HeaderAdmin,
  type HeaderConfig,
  type HeaderItem,
} from "@/lib/header-view";
import { API_BASE_URL, mediaUrl } from "@/lib/mart-api/media-url";
import { MartApiError, authorizedFetch, fileFromSrc } from "@/lib/mart-api/products";

type ApiItem = { label?: string; href?: string; enabled?: boolean };
type ApiHeader = {
  items?: ApiItem[];
  logo_src?: string;
  logo_alt?: string;
  is_default?: boolean;
  logo_needs_upload?: boolean;
};

const ADMIN_URL = "/api/v1/admin/site/header";

const toItem = (item: ApiItem): HeaderItem => ({
  label: item.label ?? "",
  href: item.href ?? "",
  enabled: item.enabled !== false,
});

const toAdmin = (body: ApiHeader): HeaderAdmin => ({
  items: (body.items ?? []).map(toItem),
  logoSrc: body.logo_src ?? "",
  logoAlt: body.logo_alt ?? "",
  isDefault: body.is_default === true,
  logoNeedsUpload: body.logo_needs_upload === true,
});

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the header.";
  if (response.status === 403) return "Your account cannot edit the header.";
  return fallback;
}

const builtIn = (): HeaderConfig => ({ items: [...DEFAULT_HEADER_ITEMS] });

/**
 * The live top menu and logo. Always fetched fresh (`no-store`, no edge or KV cache), so a saved
 * edit shows on the next request. Falls back to the built-in menu and logo if the API fails.
 */
export async function listPublicHeader(): Promise<HeaderConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/site/header`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn(`[header] public header request failed with ${response.status}; showing the built-in header`);
      return builtIn();
    }
    const body = toAdmin((await response.json()) as ApiHeader);
    const src = mediaUrl(body.logoSrc);
    return {
      items: navItemsToShow(body.items),
      logo: src ? { src, alt: body.logoAlt || "Logo" } : undefined,
    };
  } catch (error) {
    // Let Next see its own control-flow errors (dynamic-usage bail-out) instead of swallowing them.
    unstable_rethrow(error);
    console.warn("[header] public header unavailable; showing the built-in header:", error instanceof Error ? error.message : error);
    return builtIn();
  }
}

export async function getAdminHeader(): Promise<HeaderAdmin> {
  const response = await authorizedFetch(ADMIN_URL);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load the header."));
  return toAdmin((await response.json()) as ApiHeader);
}

/** Sends a chosen logo (a blob: preview) to the media store; returns its `/media/header/..` path. */
export async function uploadHeaderLogo(src: string): Promise<string> {
  const file = await fileFromSrc(src, "header-logo");
  const form = new FormData();
  form.append("image", file);
  const response = await authorizedFetch(`${ADMIN_URL}/logo`, { method: "POST", body: form });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not upload the logo."));
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new MartApiError("Could not upload the logo.");
  return body.url;
}

/** Saves the menu and logo; a freshly chosen logo (blob:) is uploaded first. */
export async function saveHeader(draft: Pick<HeaderAdmin, "items" | "logoSrc" | "logoAlt">): Promise<HeaderAdmin> {
  const logoSrc = draft.logoSrc.startsWith("blob:") ? await uploadHeaderLogo(draft.logoSrc) : draft.logoSrc;
  const response = await authorizedFetch(ADMIN_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: draft.items.map((item) => ({
        label: item.label.trim(),
        href: item.href.trim(),
        enabled: item.enabled,
      })),
      logo_src: logoSrc,
      logo_alt: logoSrc ? draft.logoAlt.trim() : "",
    }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not save the header."));
  return toAdmin((await response.json()) as ApiHeader);
}

/** Removes the saved menu and logo so the built-in ones apply again. */
export async function resetHeader(): Promise<HeaderAdmin> {
  const response = await authorizedFetch(ADMIN_URL, { method: "DELETE" });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not restore the default header."));
  }
  return toAdmin((await response.json()) as ApiHeader);
}
