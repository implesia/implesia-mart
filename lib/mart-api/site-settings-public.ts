import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

import { API_BASE_URL } from "@/lib/mart-api/media-url";
import { resolveStorefrontSeo, storefrontSeoFromResponse, type ResolvedStorefrontSeo } from "@/lib/site-seo";

/** Matches `Cache-Control: public, max-age=60` on `GET /api/v1/site/settings`. */
export const SITE_SETTINGS_REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 3_000;

/**
 * The home route is `force-dynamic`, which turns every `fetch` on that route
 * into `no-store`. This cache is separate, so a success or a failure is reused
 * for about a minute instead of waiting on the API for every page.
 * A timeout, a non-200, or JSON that is not the settings object becomes the
 * built-in title, description, and template.
 */
const readCachedSiteSettings = unstable_cache(
  async (): Promise<ResolvedStorefrontSeo> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/site/settings`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "omit",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return resolveStorefrontSeo(null);
      return storefrontSeoFromResponse(true, await response.json());
    } catch (error) {
      unstable_rethrow(error);
      return resolveStorefrontSeo(null);
    }
  },
  ["public-site-settings", API_BASE_URL],
  { revalidate: SITE_SETTINGS_REVALIDATE_SECONDS },
);

/** Server-only. On any error, the built-in title, description, and template. */
export const getPublicSiteSettings = cache(async (): Promise<ResolvedStorefrontSeo> => {
  try {
    return await readCachedSiteSettings();
  } catch (error) {
    unstable_rethrow(error);
    return resolveStorefrontSeo(null);
  }
});
