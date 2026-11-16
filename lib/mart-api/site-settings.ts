import { mockFallbackAllowed } from "@/lib/mock-mode";
import { patchMockSiteSettings, readMockSiteSettings } from "@/lib/mart-mock/site-settings";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";
import {
  parseSiteSettings,
  siteSettingsUpdate,
  type SeoDraft,
  type SiteSettingsWire,
} from "@/lib/site-seo";

const ADMIN_URL = "/api/v1/admin/site/settings";

export type AdminSiteSettings = {
  settings: SiteSettingsWire;
  /** True when the form is using the in-app stand-in because the route did not answer. */
  mocked: boolean;
};

let mode: "unknown" | "live" | "mock" = "unknown";

function routeMissing(status: number) {
  return status === 404 || status === 501 || status >= 500;
}

/** 404, 501, or 5xx (or the API cannot be reached) uses the stand-in, and only while stand-ins are allowed. */
async function backend(): Promise<"live" | "mock"> {
  if (!mockFallbackAllowed()) return "live";
  if (process.env.NEXT_PUBLIC_SITE_SETTINGS_MOCK === "1") return "mock";
  if (mode !== "unknown") return mode;
  try {
    const response = await authorizedFetch(ADMIN_URL, { cache: "no-store" });
    mode = routeMissing(response.status) ? "mock" : "live";
  } catch {
    mode = "mock";
  }
  return mode;
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit SEO settings.";
  if (response.status === 403) return "Your account cannot edit SEO settings.";
  return fallback;
}

function assertSettings(body: unknown, fallback: string): SiteSettingsWire {
  const settings = parseSiteSettings(body);
  if (!settings) throw new MartApiError(fallback);
  return settings;
}

export async function getAdminSiteSettings(): Promise<AdminSiteSettings> {
  if ((await backend()) === "mock") {
    return { settings: readMockSiteSettings(), mocked: true };
  }
  const response = await authorizedFetch(ADMIN_URL, { cache: "no-store" });
  if (!response.ok) {
    if (mockFallbackAllowed() && routeMissing(response.status)) {
      mode = "mock";
      return { settings: readMockSiteSettings(), mocked: true };
    }
    throw new MartApiError(await readError(response, "Could not load SEO settings."));
  }
  return {
    settings: assertSettings(await response.json(), "Could not read the SEO settings."),
    mocked: false,
  };
}

export async function saveAdminSiteSettings(draft: SeoDraft): Promise<AdminSiteSettings> {
  const update = siteSettingsUpdate(draft);
  if (!update.ok) throw new MartApiError(update.message);
  if ((await backend()) === "mock") {
    return { settings: patchMockSiteSettings(update.next), mocked: true };
  }
  const response = await authorizedFetch(ADMIN_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update.next),
    cache: "no-store",
  });
  if (!response.ok) {
    if (mockFallbackAllowed() && routeMissing(response.status)) {
      mode = "mock";
      return { settings: patchMockSiteSettings(update.next), mocked: true };
    }
    throw new MartApiError(await readError(response, "Could not save SEO settings."));
  }
  return {
    settings: assertSettings(await response.json(), "Could not read the saved SEO settings."),
    mocked: false,
  };
}
