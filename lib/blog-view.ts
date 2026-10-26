import { API_BASE_URL, mediaUrl } from "@/lib/mart-api/media-url";
import { absoluteUrl, bengaliDateToIso } from "@/lib/seo";

/** Cards shown before "show more", and how many each click adds. */
export const BLOG_PAGE_SIZE = 9;

type Searchable = {
  title: string;
  excerpt: string;
  tags: string[];
  categoryId: string;
};

/** The image URL a visitor's browser can load, or "" (missing, blob:, data:, javascript:...). */
export function coverSrc(raw: string | undefined | null): string {
  return mediaUrl(raw ?? "");
}

/** Admin preview: a freshly chosen file is a blob: URL until it is uploaded on Save. */
export function adminCoverSrc(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  return value.startsWith("blob:") ? value : coverSrc(value);
}

function fold(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("en-US").trim();
}

/** Published posts matching the search text (title, excerpt, tags) and category. */
export function filterPosts<T extends Searchable>(
  posts: T[],
  { query = "", categoryId = "all" }: { query?: string; categoryId?: string },
): T[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  return posts.filter((post) => {
    if (categoryId !== "all" && post.categoryId !== categoryId) return false;
    if (terms.length === 0) return true;
    const haystack = fold([post.title, post.excerpt, ...post.tags].join(" "));
    return terms.every((term) => haystack.includes(term));
  });
}

export function nextVisibleCount(current: number, total: number): number {
  return Math.min(total, current + BLOG_PAGE_SIZE);
}

type SeoSource = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  coverAlt: string;
  author: string;
  publishedAt: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
};

/** Page metadata for one article. Empty SEO fields fall back to the title and excerpt. */
export function articleSeo(post: SeoSource) {
  const title = post.seoTitle?.trim() || post.title;
  const description = post.seoDescription?.trim() || post.excerpt;
  const cover = coverSrc(post.coverImage);
  const url = absoluteUrl(`/blogs/${post.slug}`);
  return {
    title,
    description,
    url,
    image: cover ? absoluteUrl(cover) : "",
    imageAlt: post.coverAlt.trim() || post.title,
    authors: post.author.trim() ? [post.author.trim()] : [],
    publishedTime: bengaliDateToIso(post.publishedAt),
    keywords: post.tags,
  };
}

/** next/image only optimizes hosts listed in next.config; anything else is served as-is. */
export function canOptimize(src: string): boolean {
  return src.startsWith("/") || src.startsWith(`${API_BASE_URL}/`);
}
