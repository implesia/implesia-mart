import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listPublicBlogCategories } from "@/lib/mart-api/blog-categories";
import { listPublicBlogCta } from "@/lib/mart-api/blog-cta";
import { listPublicBlogListing } from "@/lib/mart-api/blog-listing";
import {
  getPublicBlogPost,
  isMissingBlogPost,
  listPublicBlogPosts,
} from "@/lib/mart-api/blog-posts";
import { listPublicBlogRelated } from "@/lib/mart-api/blog-related";
import { articleSeo } from "@/lib/blog-view";

import { BlogArticle } from "../_components/blog-article";

// Render per request: the Workers KV fetch/ISR cache hit its daily write limit and
// kept serving stale CMS data (old image URLs). CMS reads go straight to the API.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);
  if (!post) {
    if (await isMissingBlogPost(slug)) notFound();
    return { title: "ব্লগ" };
  }

  const seo = articleSeo(post);
  const images = seo.image ? [{ url: seo.image, alt: seo.imageAlt, width: 1200, height: 675 }] : [];

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: seo.url },
    openGraph: {
      type: "article",
      url: seo.url,
      title: seo.title,
      description: seo.description,
      ...(images.length ? { images } : {}),
      authors: seo.authors,
      publishedTime: seo.publishedTime,
      tags: seo.keywords,
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: seo.title,
      description: seo.description,
      ...(seo.image ? { images: [seo.image] } : {}),
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, posts, categories, listing, related, cta] = await Promise.all([
    getPublicBlogPost(slug),
    listPublicBlogPosts(),
    listPublicBlogCategories(),
    listPublicBlogListing(),
    listPublicBlogRelated(),
    listPublicBlogCta(),
  ]);
  if (!post && (await isMissingBlogPost(slug))) notFound();
  return (
    <BlogArticle
      post={post}
      posts={posts}
      categories={categories}
      listing={listing}
      related={related}
      cta={cta}
    />
  );
}
