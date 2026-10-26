import { canOptimize } from "@/lib/blog-view";

export type FooterLink = { label: string; href: string; enabled: boolean };
export type FooterSection = { title: string; enabled: boolean; links: FooterLink[] };
export type FooterTrustPoint = { icon: string; label: string; enabled: boolean };

/** What the storefront renders (the API already drops disabled items). */
export type FooterConfig = {
  brandName: string;
  description: string;
  logoSrc: string;
  logoAlt: string;
  address: string;
  copyrightText: string;
  showContact: boolean;
  showSocial: boolean;
  showWhatsappCta: boolean;
  sections: FooterSection[];
  trustPoints: FooterTrustPoint[];
  legalLinks: FooterLink[];
};

export type FooterAdmin = FooterConfig & {
  /** No footer has been saved yet: the built-in defaults are showing. */
  isDefault: boolean;
  /** The stored logo cannot be shown (not a usable path or URL): upload it again. */
  logoNeedsUpload: boolean;
};

export const FOOTER_LIMITS = {
  brandName: 80,
  description: 400,
  logoAlt: 120,
  address: 300,
  copyrightText: 160,
  sectionTitle: 60,
  linkLabel: 80,
  linkHref: 255,
  trustLabel: 80,
  trustIcon: 40,
  sections: 8,
  linksPerSection: 12,
  trustPoints: 6,
  legalLinks: 8,
} as const;

const link = (label: string, href: string): FooterLink => ({ label, href, enabled: true });

/**
 * The footer the storefront had before it was editable. This mirrors the API defaults
 * (`app/services/site_footer_defaults.py`) and is used only when the API cannot be reached.
 */
export const DEFAULT_FOOTER: FooterConfig = {
  brandName: "Implesia Mart",
  description:
    "ট্রেন্ডিং গ্যাজেট আর হাতে তৈরি গর্জিয়াস ড্রেস — ক্যাশ অন ডেলিভারিতে সারাদেশে, নিশ্চিন্তে কিনুন।",
  logoSrc: "",
  logoAlt: "",
  address: "",
  copyrightText: "© {year} · সর্বস্বত্ব সংরক্ষিত",
  showContact: true,
  showSocial: true,
  showWhatsappCta: true,
  sections: [
    {
      title: "Shop",
      enabled: true,
      links: [
        link("সব প্রোডাক্ট", "/products"),
        link("Trending Gadgets", "/products?category=gadgets"),
        link("গর্জিয়াস ড্রেস", "/products?category=fashion"),
        link("গাইড ও ব্লগ", "/blogs"),
      ],
    },
    {
      title: "Company",
      enabled: true,
      links: [
        link("আমাদের সম্পর্কে", "/about-us"),
        link("সাসটেইনেবিলিটি", "/sustainability"),
        link("যোগাযোগ", "/contact-us"),
        link("ব্লগ", "/blogs"),
      ],
    },
    {
      title: "Support",
      enabled: true,
      links: [
        link("আমার অর্ডার", "/order-status"),
        link("প্রশ্নোত্তর", "/faqs"),
        link("শিপিং ও রিটার্ন", "/shipping-returns"),
        link("গোপনীয়তা নীতি", "/privacy-policy"),
        link("চেকআউট", "/checkout"),
      ],
    },
  ],
  trustPoints: [
    { icon: "local_shipping", label: "সারাদেশে ডেলিভারি", enabled: true },
    { icon: "payments", label: "ক্যাশ অন ডেলিভারি", enabled: true },
    { icon: "assignment_return", label: "৩ দিনের ইজি রিটার্ন", enabled: true },
  ],
  legalLinks: [
    link("গোপনীয়তা", "/privacy-policy"),
    link("শিপিং", "/shipping-returns"),
    link("আমার অর্ডার", "/order-status"),
    link("প্রশ্নোত্তর", "/faqs"),
  ],
};

export function defaultFooterAdmin(): FooterAdmin {
  return { ...structuredClone(DEFAULT_FOOTER), isDefault: true, logoNeedsUpload: false };
}

const PHONE = /^[0-9+\-().]{3,30}$/;
const MAIL = /^[^@/\\:,;\s]+@[^@/\\:,;\s]+\.[^@/\\:,;\s]+$/;

/** A footer link target the storefront may render: site path, http(s), mailto: or tel:. */
export function isSafeFooterHref(value: string): boolean {
  const href = value.trim();
  if (!href || href.length > FOOTER_LIMITS.linkHref) return false;
  if (/[\s\u0000-\u001f\u007f]/.test(href) || href.includes("\\")) return false;
  const lower = href.toLowerCase();
  if (lower.startsWith("mailto:")) return MAIL.test(href.slice(7).split("?")[0]);
  if (lower.startsWith("tel:")) return PHONE.test(href.slice(4));
  if (href.startsWith("/")) return !href.startsWith("//") && !href.includes("..");
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    try {
      return Boolean(new URL(href).hostname);
    } catch {
      return false;
    }
  }
  return false;
}

export function safeFooterHref(value: string): string {
  return isSafeFooterHref(value) ? value.trim() : "";
}

/**
 * A href that comes from the contact details (their own admin page). Only the scheme is
 * checked, so a number written as `tel:+880 1516 527932` still works; javascript:, data:
 * and other schemes never render.
 */
export function safeContactHref(value: string): string {
  const href = value.trim();
  if (!href || /[\u0000-\u001f\u007f\\]/.test(href)) return "";
  if (href.startsWith("/")) return href.startsWith("//") ? "" : href;
  return /^(https?:\/\/|mailto:|tel:)\S/i.test(href) ? href : "";
}

/** Links that leave the site open in a new tab; paths, mailto: and tel: stay in place. */
export function isExternalFooterHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Replaces the `{year}` placeholder; the rest is shown as plain text. */
export function copyrightLine(text: string, year: number): string {
  return text.replaceAll("{year}", String(year));
}

export function footerLogoOptimizes(src: string): boolean {
  return canOptimize(src);
}

const HTML = /[<>]/;

function textProblem(label: string, value: string, max: number, required: boolean) {
  const text = value.trim();
  if (required && !text) return `${label} is required.`;
  if (text.length > max) return `${label} must be at most ${max} characters.`;
  if (HTML.test(text)) return `${label} must be plain text (no < or >).`;
  return "";
}

function linkProblem(where: string, item: FooterLink): string {
  return (
    textProblem(`${where} label`, item.label, FOOTER_LIMITS.linkLabel, true) ||
    (isSafeFooterHref(item.href)
      ? ""
      : `${where} link must start with /, http(s)://, mailto: or tel:.`)
  );
}

/** The first thing wrong with a draft, or "" when it can be saved (the API re-checks). */
export function footerDraftError(draft: FooterConfig): string {
  const top =
    textProblem("Brand name", draft.brandName, FOOTER_LIMITS.brandName, true) ||
    textProblem("Description", draft.description, FOOTER_LIMITS.description, false) ||
    textProblem("Address", draft.address, FOOTER_LIMITS.address, false) ||
    textProblem("Copyright text", draft.copyrightText, FOOTER_LIMITS.copyrightText, true) ||
    textProblem("Logo description", draft.logoAlt, FOOTER_LIMITS.logoAlt, false);
  if (top) return top;
  if (draft.logoSrc && !draft.logoAlt.trim()) return "Describe the logo for screen readers.";
  if (draft.sections.length > FOOTER_LIMITS.sections) return "Too many link columns.";
  for (const [i, section] of draft.sections.entries()) {
    const where = `Column ${i + 1}`;
    const problem = textProblem(`${where} title`, section.title, FOOTER_LIMITS.sectionTitle, true);
    if (problem) return problem;
    if (section.links.length > FOOTER_LIMITS.linksPerSection) return `${where} has too many links.`;
    for (const [j, item] of section.links.entries()) {
      const bad = linkProblem(`${where}, link ${j + 1}`, item);
      if (bad) return bad;
    }
  }
  if (draft.trustPoints.length > FOOTER_LIMITS.trustPoints) return "Too many trust points.";
  for (const [i, point] of draft.trustPoints.entries()) {
    const bad =
      textProblem(`Trust point ${i + 1}`, point.label, FOOTER_LIMITS.trustLabel, true) ||
      (/^[a-z0-9_]{1,40}$/.test(point.icon.trim())
        ? ""
        : `Trust point ${i + 1} icon must be a Material icon name (lowercase, digits, _).`);
    if (bad) return bad;
  }
  if (draft.legalLinks.length > FOOTER_LIMITS.legalLinks) return "Too many legal links.";
  for (const [i, item] of draft.legalLinks.entries()) {
    const bad = linkProblem(`Legal link ${i + 1}`, item);
    if (bad) return bad;
  }
  return "";
}

/** The storefront projection of a draft: only enabled items, empty columns dropped. */
export function previewFooter(draft: FooterConfig): FooterConfig {
  const sections = draft.sections
    .map((section) => ({ ...section, links: section.links.filter((l) => l.enabled && safeFooterHref(l.href)) }))
    .filter((section) => section.enabled && section.links.length > 0);
  return {
    ...draft,
    sections,
    trustPoints: draft.trustPoints.filter((p) => p.enabled),
    legalLinks: draft.legalLinks.filter((l) => l.enabled && safeFooterHref(l.href)),
  };
}

/** A new array with the item at `from` moved to `to` (clamped); the input is not changed. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length) return next;
  const target = Math.min(next.length - 1, Math.max(0, to));
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}

export const blankLink = (): FooterLink => ({ label: "", href: "/", enabled: true });
export const blankSection = (): FooterSection => ({ title: "", enabled: true, links: [blankLink()] });
export const blankTrustPoint = (): FooterTrustPoint => ({ icon: "verified", label: "", enabled: true });
