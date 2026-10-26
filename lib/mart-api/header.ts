import { unstable_rethrow } from "next/navigation";

import {
  DEFAULT_HEADER_ITEMS,
  navItemsToShow,
  type HeaderAdmin,
  type HeaderItem,
} from "@/lib/header-view";
import { API_BASE_URL } from "@/lib/mart-api/media-url";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

type ApiItem = { label?: string; href?: string; enabled?: boolean };
type ApiHeader = { items?: ApiItem[]; is_default?: boolean };

const ADMIN_URL = "/api/v1/admin/site/header";

const toItem = (item: ApiItem): HeaderItem => ({
  label: item.label ?? "",
  href: item.href ?? "",
  enabled: item.enabled !== false,
});

const toAdmin = (body: ApiHeader): HeaderAdmin => ({
  items: (body.items ?? []).map(toItem),
  isDefault: body.is_default === true,
});

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the menu.";
  if (response.status === 403) return "Your account cannot edit the menu.";
  return fallback;
}

/**
 * The live top menu. Always fetched fresh (`no-store`, no edge or KV cache), so a saved edit
 * shows on the next request. Falls back to the built-in menu if the API fails.
 */
export async function listPublicHeaderItems(): Promise<HeaderItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/site/header`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn(`[header] public menu request failed with ${response.status}; showing the built-in menu`);
      return [...DEFAULT_HEADER_ITEMS];
    }
    return navItemsToShow(toAdmin((await response.json()) as ApiHeader).items);
  } catch (error) {
    // Let Next see its own control-flow errors (dynamic-usage bail-out) instead of swallowing them.
    unstable_rethrow(error);
    console.warn("[header] public menu unavailable; showing the built-in menu:", error instanceof Error ? error.message : error);
    return [...DEFAULT_HEADER_ITEMS];
  }
}

export async function getAdminHeader(): Promise<HeaderAdmin> {
  const response = await authorizedFetch(ADMIN_URL);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load the menu."));
  return toAdmin((await response.json()) as ApiHeader);
}

export async function saveHeader(items: readonly HeaderItem[]): Promise<HeaderAdmin> {
  const response = await authorizedFetch(ADMIN_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((item) => ({
        label: item.label.trim(),
        href: item.href.trim(),
        enabled: item.enabled,
      })),
    }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not save the menu."));
  return toAdmin((await response.json()) as ApiHeader);
}

/** Removes the saved menu so the built-in links apply again. */
export async function resetHeader(): Promise<HeaderAdmin> {
  const response = await authorizedFetch(ADMIN_URL, { method: "DELETE" });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not restore the default menu."));
  }
  return toAdmin((await response.json()) as ApiHeader);
}
