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
import { bengaliDateToIso } from "@/lib/seo";

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

  const url = `/blogs/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      images: [
        { url: post.coverImage, alt: post.coverAlt, width: 1200, height: 675 },
      ],
      authors: [post.author],
      publishedTime: bengaliDateToIso(post.publishedAt),
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
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
