import { FOOTER_LIMITS, isSafeFooterHref, type FooterLink } from "@/lib/footer-view";

/** One top-menu link. Same shape and URL rules as a footer link. */
export type HeaderItem = FooterLink;

export type HeaderAdmin = { items: HeaderItem[]; isDefault: boolean };

export const HEADER_LIMITS = { items: 8, label: FOOTER_LIMITS.linkLabel } as const;

/**
 * The menu the storefront had before it was editable. Mirrors the API default
 * (`app/services/site_header_defaults.py`) and is shown when the API is unreachable.
 */
export const DEFAULT_HEADER_ITEMS: readonly HeaderItem[] = [
  { label: "হোম", href: "/", enabled: true },
  { label: "প্রোডাক্ট", href: "/products", enabled: true },
  { label: "আমাদের সম্পর্কে", href: "/about-us", enabled: true },
  { label: "সাসটেইনেবিলিটি", href: "/sustainability", enabled: true },
  { label: "যোগাযোগ", href: "/contact-us", enabled: true },
  { label: "ব্লগ", href: "/blogs", enabled: true },
];

/** What the storefront renders: enabled links with a safe target only (never an empty menu). */
export function navItemsToShow(items: readonly HeaderItem[]): HeaderItem[] {
  const shown = items
    .map((item) => ({ ...item, label: item.label.trim(), href: item.href.trim() }))
    .filter((item) => item.enabled && item.label && isSafeFooterHref(item.href));
  return shown.length > 0 ? shown : [...DEFAULT_HEADER_ITEMS];
}

export function defaultHeaderAdmin(): HeaderAdmin {
  return { items: DEFAULT_HEADER_ITEMS.map((item) => ({ ...item })), isDefault: true };
}

const HTML = /[<>]/;

/** The first thing wrong with a draft menu, or "" when it can be saved (the API re-checks). */
export function headerDraftError(items: readonly HeaderItem[]): string {
  if (items.length === 0) return "Add at least one menu link.";
  if (items.length > HEADER_LIMITS.items) return `A menu can have at most ${HEADER_LIMITS.items} links.`;
  if (!items.some((item) => item.enabled)) return "Keep at least one menu link shown.";
  for (const [i, item] of items.entries()) {
    const where = `Menu link ${i + 1}`;
    const label = item.label.trim();
    if (!label) return `${where} needs a label.`;
    if (label.length > HEADER_LIMITS.label) return `${where} label must be at most ${HEADER_LIMITS.label} characters.`;
    if (HTML.test(label)) return `${where} label must be plain text (no < or >).`;
    if (!isSafeFooterHref(item.href)) return `${where} link must start with /, http(s)://, mailto: or tel:.`;
  }
  return "";
}
