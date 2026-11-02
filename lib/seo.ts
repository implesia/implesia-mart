import type { Metadata } from "next";

/**
 * Centralized SEO constants so metadata, sitemap, robots and JSON-LD
 * all agree on the same site identity instead of hardcoding strings
 * per-file.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mart.implesia.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Implesia Mart";

export const DEFAULT_TITLE = "Implesia Mart | ট্রেন্ডিং গ্যাজেট ও হাতে তৈরি গর্জিয়াস ড্রেস";

export const DEFAULT_DESCRIPTION =
  "ইমপ্লেসিয়া মার্ট — ট্রেন্ডিং গ্যাজেট ও হাতে তৈরি কাস্টম ড্রেস, ক্যাশ অন ডেলিভারিতে সারাদেশে দ্রুত ডেলিভারি।";

export const DEFAULT_KEYWORDS = [
  "Implesia Mart",
  "ইমপ্লেসিয়া মার্ট",
  "অনলাইন শপিং বাংলাদেশ",
  "গ্যাজেট",
  "কাস্টম ড্রেস",
  "ক্যাশ অন ডেলিভারি",
];

export type ShareImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

/** The generated share card (app/opengraph-image.tsx). */
export const DEFAULT_SHARE_IMAGE: ShareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Implesia Mart — Trending Gadgets & Handmade Custom Dresses",
};

/**
 * Open Graph fields every page shares. A page's own `openGraph` replaces the
 * root one entirely (no deep merge), so pages spread this in.
 */
export const OPEN_GRAPH_DEFAULTS = {
  type: "website" as const,
  siteName: SITE_NAME,
  locale: "bn_BD",
  images: [DEFAULT_SHARE_IMAGE],
};

/** "Title | Implesia Mart", as the root title template renders it. */
export function brandedTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

/** Drops a trailing "| Implesia Mart" so the title template adds it only once. */
export function withoutBrandSuffix(title: string): string {
  const trimmed = title.replace(/(?:\s*[|\-–—]\s*Implesia\s+Mart)+\s*$/i, "").trim();
  return trimmed || title.trim();
}

/** One line, at most `max` characters, cut at a word boundary with "…". */
export function trimDescription(text: string, max = 160): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= max) return line;
  const cut = line.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:।-]+$/, "")}…`;
}

type ProductSeoSource = {
  title: string;
  description: string;
  subtitle?: string;
  tagline?: string;
  seo?: { title: string; description: string; keywords: string[] };
};

/**
 * Search title, description and keywords for a product: the admin's SEO fields
 * when set, else the product title and its description cut to ~160 characters.
 */
export function productSeo(product: ProductSeoSource) {
  const name = withoutBrandSuffix(product.title);
  const title = withoutBrandSuffix(product.seo?.title.trim() || product.title);
  const description =
    product.seo?.description.trim() ||
    trimDescription(product.description || product.tagline || product.subtitle || name);
  const keywords = product.seo?.keywords.length
    ? product.seo.keywords
    : [name, product.subtitle, product.tagline].filter((value): value is string =>
        Boolean(value?.trim()),
      );
  return { name, title, description, keywords };
}

type PageMetadataOptions = {
  /** Page title without the site name (the root template adds it). */
  title: string;
  description: string;
  /** Site-relative path: the canonical URL and og:url. */
  path: string;
  /** Use `title` as is (no "| Implesia Mart" suffix). */
  absoluteTitle?: boolean;
  /** Pages that must stay out of search: no canonical, robots noindex. */
  noindex?: { follow: boolean };
  images?: ShareImage[];
  keywords?: string[];
  /** Blog posts: og:type article with these fields. */
  article?: { authors?: string[]; publishedTime?: string; tags?: string[] };
  /** Product pages: og:type product with product:price:amount / product:price:currency. */
  product?: { price: number; currency: string };
};

/**
 * Metadata for one page: title, description, canonical, and share cards
 * (og:url / og:title / twitter:title per page on top of the shared defaults).
 */
export function pageMetadata(options: PageMetadataOptions): Metadata {
  const { description, path, absoluteTitle, noindex, keywords, article, product } = options;
  const title = absoluteTitle ? options.title : withoutBrandSuffix(options.title);
  const shareTitle = absoluteTitle ? title : brandedTitle(title);
  const images = options.images?.length ? options.images : [DEFAULT_SHARE_IMAGE];
  // Next rejects og:type "product" (not in its list), so a product page drops the
  // default og:type and sends og:type + product:price:* through `other`.
  const { type: defaultType, ...ogDefaults } = OPEN_GRAPH_DEFAULTS;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    ...(noindex
      ? { robots: { index: false, follow: noindex.follow } }
      : { alternates: { canonical: path } }),
    openGraph: {
      ...ogDefaults,
      ...(product ? {} : { type: defaultType }),
      url: path,
      title: shareTitle,
      description,
      images,
      ...(article ? { ...article, type: "article" as const } : {}),
    },
    ...(product
      ? {
          other: {
            "og:type": "product",
            "product:price:amount": String(product.price),
            "product:price:currency": product.currency,
          },
        }
      : {}),
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: images.map((image) => image.url),
    },
  };
}

/**
 * Search Console / Bing Webmaster verification tags, only for the tokens that are set
 * (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`, read at build time).
 */
export function siteVerification(
  env: { google?: string; bing?: string } = {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
  },
): Metadata["verification"] | undefined {
  const google = env.google?.trim();
  const bing = env.bing?.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

/** Resolves a site-relative path to a fully-qualified absolute URL. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  // The home page canonical renders without a trailing slash; keep every reference identical.
  if (path === "/" || path === "") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const BENGALI_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

const BENGALI_MONTHS: Record<string, number> = {
  জানুয়ারি: 0,
  ফেব্রুয়ারি: 1,
  মার্চ: 2,
  এপ্রিল: 3,
  মে: 4,
  জুন: 5,
  জুলাই: 6,
  আগস্ট: 7,
  সেপ্টেম্বর: 8,
  অক্টোবর: 9,
  নভেম্বর: 10,
  ডিসেম্বর: 11,
};

/**
 * Converts copy dates like "১৮ জুলাই, ২০২৬" into an ISO 8601 string for
 * JSON-LD (datePublished/dateModified require machine-readable dates).
 * Returns undefined if the string can't be confidently parsed.
 */
export function bengaliDateToIso(value: string): string | undefined {
  const normalized = value.replace(/[০-৯]/g, (d) => BENGALI_DIGITS[d] ?? d);
  const match = normalized.match(/(\d{1,2})\s+([^\s,]+),?\s*(\d{4})/);
  if (!match) return undefined;

  const [, day, monthName, year] = match;
  const monthIndex = BENGALI_MONTHS[monthName];
  if (monthIndex === undefined) return undefined;

  const date = new Date(Number(year), monthIndex, Number(day));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
