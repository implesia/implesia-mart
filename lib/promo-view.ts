import { canOptimize, coverSrc } from "@/lib/blog-view";

export type PromoTone = "dark" | "light";

export type PromoPublic = {
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
  focalX: number;
  focalY: number;
  tone: PromoTone;
};

export type PromoAdmin = PromoPublic & {
  isActive: boolean;
  /** The stored image cannot be shown (e.g. a legacy temporary link): upload it again. */
  imageNeedsUpload: boolean;
};

export const PROMO_LIMITS = {
  eyebrow: 80,
  heading: 120,
  body: 200,
  ctaLabel: 60,
  ctaHref: 255,
  imageAlt: 200,
} as const;

export function blankPromo(): PromoAdmin {
  return {
    isActive: false,
    eyebrow: "",
    heading: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
    imageSrc: "",
    imageAlt: "",
    focalX: 50,
    focalY: 50,
    tone: "dark",
    imageNeedsUpload: false,
  };
}

/** A whole percentage between 0 and 100; anything else falls back to the centre. */
export function clampFocal(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** CSS `object-position` for the chosen focal point. */
export function focalPosition(x: unknown, y: unknown): string {
  return `${clampFocal(x)}% ${clampFocal(y)}%`;
}

/** The URL the browser can load for the banner image, or "" when it is missing or unsafe. */
export function bannerImageSrc(raw: string | undefined | null): string {
  return coverSrc(raw);
}

export function bannerCanOptimize(src: string): boolean {
  return canOptimize(src);
}

/** Internal path ("/x") or http(s) URL; protocol-relative, script and data links are refused. */
export function safeCtaHref(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (!value || /[\u0000-\u001f\s\\]/.test(value)) return "";
  if (value.startsWith("//")) return "";
  if (value.startsWith("/")) return value.includes("..") ? "" : value;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** A banner is rendered only with a usable image and description; the CTA only with a usable link. */
export function renderablePromo(promo: PromoPublic | null | undefined) {
  if (!promo) return null;
  const image = bannerImageSrc(promo.imageSrc);
  const alt = promo.imageAlt.trim();
  if (!image || !alt) return null;
  const href = safeCtaHref(promo.ctaHref);
  const cta = href && promo.ctaLabel.trim() ? { href, label: promo.ctaLabel.trim() } : null;
  return { image, alt, cta, position: focalPosition(promo.focalX, promo.focalY) };
}

/** Message for the first problem that would stop the API saving this banner, else "". */
export function promoDraftError(draft: PromoAdmin): string {
  const hasLink = draft.ctaHref.trim() !== "";
  const hasLabel = draft.ctaLabel.trim() !== "";
  if (hasLink !== hasLabel) return "Add both the button text and the button link, or clear both.";
  if (hasLink && !safeCtaHref(draft.ctaHref)) {
    return "The button link must start with / or https://.";
  }
  if (draft.isActive && !draft.imageSrc.trim()) return "Add an image before turning the banner on.";
  if (draft.isActive && !draft.imageAlt.trim()) {
    return "Describe the image (alt text) before turning the banner on.";
  }
  return "";
}
