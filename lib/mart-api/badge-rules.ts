/**
 * Product badges: the shape the API sends, and the design-system colours each tone maps to.
 * Pure (no fetch, no React) so the storefront, the admin and the tests share it.
 */

export const BADGE_TONES = ["primary", "gold", "dark", "alert", "soft", "soft-gold"] as const;
export type BadgeTone = (typeof BADGE_TONES)[number];

/** What a shopper sees. The API only sends active badges on public responses. */
export type StoreBadge = { name: string; slug: string; tone: BadgeTone };

/** A badge as attached to a product in the admin (switched-off ones included). */
export type AdminBadgeRef = StoreBadge & { id: string; isActive: boolean };

export type AdminBadge = AdminBadgeRef & { isSystem: boolean; productCount: number };

export const BADGE_NAME_MAX = 32;
export const BADGES_PER_PRODUCT_MAX = 8;
/** Pills on a product card; the detail page shows them all. */
export const CARD_BADGE_LIMIT = 2;

const TONE_SET = new Set<string>(BADGE_TONES);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEGACY_SLUG: Record<string, string> = {
  New: "new",
  "Best Seller": "best-seller",
  Limited: "limited",
};

/** Existing chip colour pairs only; a badge can never introduce a new colour. */
export const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
  primary: "bg-primary text-on-primary",
  gold: "bg-warm-gold text-on-surface",
  dark: "bg-on-surface/85 text-white",
  alert: "bg-error text-on-error",
  soft: "bg-primary/10 text-primary",
  "soft-gold": "bg-warm-gold/15 text-on-surface",
};

export const BADGE_TONE_LABEL: Record<BadgeTone, string> = {
  primary: "Teal",
  gold: "Gold",
  dark: "Dark",
  alert: "Red",
  soft: "Soft teal",
  "soft-gold": "Soft gold",
};

export function isBadgeTone(value: unknown): value is BadgeTone {
  return typeof value === "string" && TONE_SET.has(value);
}

export function badgeToneClass(tone: BadgeTone): string {
  return BADGE_TONE_CLASS[tone] ?? BADGE_TONE_CLASS.primary;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readStoreBadge(value: unknown): StoreBadge | null {
  const record = asRecord(value);
  if (!record) return null;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const slug = typeof record.slug === "string" ? record.slug : "";
  if (!name || name.length > BADGE_NAME_MAX || !SLUG.test(slug) || slug.length > 48) return null;
  return { name, slug, tone: isBadgeTone(record.tone) ? record.tone : "primary" };
}

/**
 * The `badges` array from a product payload. `undefined` when the field is missing (an older
 * API or seed data), so callers can fall back to the legacy single `badge`. An empty array
 * means the product really has no visible badge.
 */
export function readStoreBadges(value: unknown): StoreBadge[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const badges: StoreBadge[] = [];
  for (const item of value) {
    const badge = readStoreBadge(item);
    if (!badge || seen.has(badge.slug)) continue;
    seen.add(badge.slug);
    badges.push(badge);
    if (badges.length >= BADGES_PER_PRODUCT_MAX) break;
  }
  return badges;
}

export function readAdminBadgeRef(value: unknown): AdminBadgeRef | null {
  const badge = readStoreBadge(value);
  const record = asRecord(value);
  if (!badge || !record || typeof record.id !== "string" || !record.id) return null;
  return { ...badge, id: record.id, isActive: record.is_active !== false };
}

export function readAdminBadge(value: unknown): AdminBadge | null {
  const ref = readAdminBadgeRef(value);
  const record = asRecord(value);
  if (!ref || !record) return null;
  const count = record.product_count;
  return {
    ...ref,
    isSystem: record.is_system === true,
    productCount: typeof count === "number" && Number.isInteger(count) && count > 0 ? count : 0,
  };
}

/** Badges to show: the API's list when it sent one, else the legacy single badge. */
export function visibleBadges(
  badges: readonly StoreBadge[] | undefined,
  legacy: string | null | undefined,
): StoreBadge[] {
  if (badges) return [...badges];
  if (legacy && LEGACY_SLUG[legacy]) {
    return [{ name: legacy, slug: LEGACY_SLUG[legacy], tone: legacy === "Best Seller" ? "gold" : "primary" }];
  }
  return [];
}

/** Client-side check that mirrors the API's rules. Returns an error message or "". */
export function badgeNameError(raw: string, taken: readonly string[] = []): string {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) return "Enter a badge name.";
  if (name.length > BADGE_NAME_MAX) return `Keep the name to ${BADGE_NAME_MAX} characters or fewer.`;
  const lower = name.toLowerCase();
  if (taken.some((item) => item.toLowerCase() === lower)) return "A badge with this name already exists.";
  return "";
}
