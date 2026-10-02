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

/** Resolves a site-relative path to a fully-qualified absolute URL. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
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
