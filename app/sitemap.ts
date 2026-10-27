import type { MetadataRoute } from "next";

import { articleSeo } from "@/lib/blog-view";
import { listPublicBlogPosts } from "@/lib/mart-api/blog-posts";
import { listStoreProducts } from "@/lib/mart-api/catalog";
import { absoluteUrl } from "@/lib/seo";
import { productPath } from "@/lib/mart-api/product-url";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, blogPosts] = await Promise.all([listStoreProducts(), listPublicBlogPosts()]);
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(productPath(product)),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
    images: [absoluteUrl(product.imageSrc)],
  }));

  // The cover lives on the API origin (`/media/...`), so it goes through the same URL
  // resolution as the article page; a post without a usable cover lists no image.
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const { image } = articleSeo(post);
    return {
      url: absoluteUrl(`/blogs/${post.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      ...(image ? { images: [image] } : {}),
    };
  });

  return [...staticEntries, ...productEntries, ...blogEntries];
}
