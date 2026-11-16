import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME } from "@/lib/seo";

/** Google shows about this much of a title before cutting it off. */
export const SEO_TITLE_GUIDE = 60;
/** API limit for `seo_title`. */
export const SEO_TITLE_MAX = 70;
/** Google shows about this much of a description before cutting it off. */
export const SEO_DESCRIPTION_GUIDE = 160;
/** API limit for `seo_description`. */
export const SEO_DESCRIPTION_MAX = 170;
/** API limit for `seo_title_template`. */
export const SEO_TEMPLATE_MAX = 80;

/** The root layout's built-in title template. `%s` is the page title. */
export const DEFAULT_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

/** Public and admin wire shape. `null` means "use the built-in copy". */
export type SiteSettingsWire = {
  seo_title: string | null;
  seo_description: string | null;
  seo_title_template: string | null;
};

export type ResolvedStorefrontSeo = {
  title: string;
  description: string;
  titleTemplate: string;
};

export type SeoDraft = {
  title: string;
  description: string;
  template: string;
};

const EMPTY_WIRE: SiteSettingsWire = {
  seo_title: null,
  seo_description: null,
  seo_title_template: null,
};

export function collapseSeoText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** A set template contains `%s` exactly once and no other `%`. */
export function isTitleTemplate(value: string): boolean {
  const matches = value.match(/%s/g);
  if (!matches || matches.length !== 1) return false;
  return !value.replace("%s", "").includes("%");
}

function lengthMessage(label: string, max: number): string {
  return `${label} is at most ${max} characters.`;
}

/**
 * PATCH semantics: a missing key keeps the stored value. `null` or `""` clears
 * it (stored as `null`). Whitespace is collapsed. An invalid value is refused.
 */
export function applySiteSettingsPatch(
  current: SiteSettingsWire,
  patch: Partial<SiteSettingsWire>,
): { ok: true; next: SiteSettingsWire } | { ok: false; message: string } {
  const next: SiteSettingsWire = { ...current };
  const fields = [
    ["seo_title", "SEO title", SEO_TITLE_MAX],
    ["seo_description", "Meta description", SEO_DESCRIPTION_MAX],
    ["seo_title_template", "Title template", SEO_TEMPLATE_MAX],
  ] as const;

  for (const [key, label, max] of fields) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const value = patch[key];
    if (value == null) {
      next[key] = null;
      continue;
    }
    if (typeof value !== "string") {
      return { ok: false, message: `${label} must be text.` };
    }
    const text = collapseSeoText(value);
    if (!text) {
      next[key] = null;
      continue;
    }
    if (text.length > max) return { ok: false, message: lengthMessage(label, max) };
    if (key === "seo_title_template" && !isTitleTemplate(text)) {
      return { ok: false, message: "The title template must contain %s exactly once." };
    }
    next[key] = text;
  }

  return { ok: true, next };
}

/** The admin form always sends all three fields. Empty text clears that field. */
export function siteSettingsUpdate(draft: SeoDraft) {
  return applySiteSettingsPatch(EMPTY_WIRE, {
    seo_title: draft.title,
    seo_description: draft.description,
    seo_title_template: draft.template,
  });
}

export function draftFromSettings(settings: SiteSettingsWire): SeoDraft {
  return {
    title: settings.seo_title ?? "",
    description: settings.seo_description ?? "",
    template: settings.seo_title_template ?? "",
  };
}

function readField(value: unknown, max: number, template = false): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const text = collapseSeoText(value);
  if (!text || text.length > max) return null;
  if (template && !isTitleTemplate(text)) return null;
  return text;
}

/** `null` when the body is not an object. Bad fields become `null` (built-in copy). */
export function parseSiteSettings(body: unknown): SiteSettingsWire | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  return {
    seo_title: readField(record.seo_title, SEO_TITLE_MAX),
    seo_description: readField(record.seo_description, SEO_DESCRIPTION_MAX),
    seo_title_template: readField(record.seo_title_template, SEO_TEMPLATE_MAX, true),
  };
}

/** Null payload (any fetch error) or a null field uses the built-in copy. */
export function resolveStorefrontSeo(input: SiteSettingsWire | null): ResolvedStorefrontSeo {
  const title = input?.seo_title || DEFAULT_TITLE;
  const description = input?.seo_description || DEFAULT_DESCRIPTION;
  const template = input?.seo_title_template || DEFAULT_TITLE_TEMPLATE;
  return {
    title: title.length <= SEO_TITLE_MAX ? title : DEFAULT_TITLE,
    description: description.length <= SEO_DESCRIPTION_MAX ? description : DEFAULT_DESCRIPTION,
    titleTemplate:
      template.length <= SEO_TEMPLATE_MAX && isTitleTemplate(template)
        ? template
        : DEFAULT_TITLE_TEMPLATE,
  };
}

/** What the home result shows while the admin is typing. Empty uses the built-in copy. */
export function previewStorefrontSeo(draft: SeoDraft): ResolvedStorefrontSeo {
  const title = collapseSeoText(draft.title);
  const description = collapseSeoText(draft.description);
  const template = collapseSeoText(draft.template);
  return {
    title: title || DEFAULT_TITLE,
    description: description || DEFAULT_DESCRIPTION,
    titleTemplate: template && isTitleTemplate(template) ? template : DEFAULT_TITLE_TEMPLATE,
  };
}

/** Replaces the single `%s` in a title template. */
export function applyTitleTemplate(pageTitle: string, template: string): string {
  return template.replace("%s", pageTitle);
}

export function storefrontSeoFromResponse(ok: boolean, body: unknown): ResolvedStorefrontSeo {
  if (!ok) return resolveStorefrontSeo(null);
  return resolveStorefrontSeo(parseSiteSettings(body));
}
