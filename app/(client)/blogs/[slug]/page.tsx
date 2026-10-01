import type { Metadata } from "next";

import { bengaliDateToIso } from "@/lib/seo";

import { blogPosts, getBlogPostBySlug } from "../../_data/blogs/blogs";
import { BlogArticle } from "../_components/blog-article";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "ব্লগ" };

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
      images: [{ url: post.coverImage, alt: post.coverAlt, width: 1200, height: 675 }],
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
  return <BlogArticle slug={slug} />;
}
