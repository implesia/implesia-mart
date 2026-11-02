import type { MetadataRoute } from "next";

import { articleSeo } from "@/lib/blog-view";
import { fetchPublicBlogPosts } from "@/lib/mart-api/blog-posts";
import { loadStoreCatalog } from "@/lib/mart-api/catalog";
import { MART_API_URL } from "@/lib/mart-api/products";
import { productPath } from "@/lib/mart-api/product-url";
import { absoluteUrl } from "@/lib/seo";
import { lastModified, latest, sitemapCategories, type SitemapCategory } from "@/lib/sitemap-entries";

// Always built from the live API (no build-time snapshot).
export const dynamic = "force-dynamic";

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/blogs", priority: 0.8, changeFrequency: "daily" },
  { path: "/about-us", priority: 0.6, changeFrequency: "monthly" },
  { path: "/sustainability", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact-us", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faqs", priority: 0.5, changeFrequency: "monthly" },
  { path: "/shipping-returns", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
];

async function loadCategories(): Promise<SitemapCategory[] | null> {
  try {
    const response = await fetch(`${MART_API_URL}/api/v1/categories/tree`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { items?: unknown };
    return sitemapCategories(body.items);
  } catch {
    return null;
  }
}

/**
 * If the product catalog cannot be read, the sitemap answers with an error (5xx) instead
 * of a list without products: crawlers keep the last good sitemap and retry later.
 * Categories or blog posts failing alone only drop that section, and every failure is logged.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, categories, blog] = await Promise.all([
    loadStoreCatalog(),
    loadCategories(),
    fetchPublicBlogPosts(),
  ]);
  if (catalog.unavailable) {
    console.error("sitemap.xml: product catalog unavailable; answering with an error");
    throw new Error("Sitemap source unavailable: products");
  }
  if (!categories) console.error("sitemap.xml: category tree unavailable; categories omitted");
  if (blog.failed) console.error("sitemap.xml: blog posts unavailable; posts omitted");

  const productEntries: MetadataRoute.Sitemap = catalog.products.map((product) => {
    const modified = lastModified(product.updatedAt);
    return {
      url: absoluteUrl(productPath(product)),
      ...(modified ? { lastModified: modified } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
      ...(product.imageSrc ? { images: [absoluteUrl(product.imageSrc)] } : {}),
    };
  });

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map((category) => ({
    url: absoluteUrl(category.path),
    ...(category.lastModified ? { lastModified: category.lastModified } : {}),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // The cover lives on the API origin (`/media/...`), so it goes through the same URL
  // resolution as the article page; a post without a usable cover lists no image.
  const blogEntries: MetadataRoute.Sitemap = blog.posts.map((post) => {
    const { image, publishedTime } = articleSeo(post);
    const modified = lastModified(publishedTime);
    return {
      url: absoluteUrl(`/blogs/${post.slug}`),
      ...(modified ? { lastModified: modified } : {}),
      changeFrequency: "monthly",
      priority: 0.7,
      ...(image ? { images: [image] } : {}),
    };
  });

  // Listing pages change when their newest item changes; other static pages have no
  // reliable date, so they carry no lastmod rather than "now" on every request.
  const newestProduct = latest(catalog.products.map((product) => lastModified(product.updatedAt)));
  const newestPost = latest(blogEntries.map((entry) => entry.lastModified as Date | undefined));
  const listingDate: Record<string, Date | undefined> = {
    "/": latest([newestProduct, newestPost]),
    "/products": newestProduct,
    "/blogs": newestPost,
  };
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => {
    const modified = listingDate[route.path];
    return {
      url: absoluteUrl(route.path),
      ...(modified ? { lastModified: modified } : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
  });

  return [...staticEntries, ...categoryEntries, ...productEntries, ...blogEntries];
}
