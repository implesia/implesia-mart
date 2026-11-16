/**
 * Stand-in for `GET` / `PATCH /api/v1/admin/site/settings` when that route
 * does not answer yet. Starts empty, so the storefront built-in copy is what
 * a cleared form falls back to. The storefront never reads this module.
 */

import { applySiteSettingsPatch, type SiteSettingsWire } from "@/lib/site-seo";

const EMPTY: SiteSettingsWire = {
  seo_title: null,
  seo_description: null,
  seo_title_template: null,
};

let current: SiteSettingsWire = { ...EMPTY };

export function resetMockSiteSettings() {
  current = { ...EMPTY };
}

export function readMockSiteSettings(): SiteSettingsWire {
  return { ...current };
}

export function patchMockSiteSettings(patch: Partial<SiteSettingsWire>): SiteSettingsWire {
  const applied = applySiteSettingsPatch(current, patch);
  if (!applied.ok) {
    throw new Error(applied.message);
  }
  current = applied.next;
  return { ...current };
}
