import type { BlogBlock, BlogPostRecord } from "@/lib/mart-mock/blog-sections";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

type ApiBlock = {
  id?: string;
  type?: string;
  text?: string;
  title?: string;
  variant?: string;
  items?: string[];
  is_active?: boolean;
};

type ApiPost = {
  id?: string;
  is_active?: boolean;
  slug?: string;
  title?: string;
  excerpt?: string;
  category_id?: string | null;
  cover_image?: string;
  cover_alt?: string;
  author?: string;
  author_role?: string;
  published_at?: string;
  read_time?: string;
  tags?: string[];
  related_product_slugs?: string[];
  blocks?: ApiBlock[];
};

type ApiPosts = { posts?: ApiPost[] };

function toBlock(body: ApiBlock, index: number): BlogBlock {
  const id = body.id ?? `block-${index + 1}`;
  const isActive = body.is_active !== false;
  if (body.type === "heading") return { id, type: "heading", text: body.text ?? "", isActive };
  if (body.type === "list") return { id, type: "list", items: body.items ?? [], isActive };
  if (body.type === "callout") {
    return {
      id,
      type: "callout",
      title: body.title ?? "",
      text: body.text ?? "",
      variant: body.variant === "note" ? "note" : "tip",
      isActive,
    };
  }
  return { id, type: "paragraph", text: body.text ?? "", isActive };
}

function toPost(body: ApiPost, index: number): BlogPostRecord {
  return {
    id: body.id ?? `post-${index + 1}`,
    isActive: body.is_active !== false,
    slug: body.slug ?? "",
    title: body.title ?? "",
    excerpt: body.excerpt ?? "",
    categoryId: body.category_id ?? "",
    coverImage: body.cover_image ?? "",
    coverAlt: body.cover_alt ?? "",
    author: body.author ?? "",
    authorRole: body.author_role ?? "",
    publishedAt: body.published_at ?? "",
    readTime: body.read_time ?? "",
    tags: body.tags ?? [],
    relatedProductSlugs: body.related_product_slugs ?? [],
    content: (body.blocks ?? []).map(toBlock),
  };
}

function blockBody(block: BlogBlock) {
  const base = {
    type: block.type,
    is_active: block.isActive !== false,
    text: "",
    title: "",
    variant: "tip",
    items: [] as string[],
  };
  if (block.type === "list") return { ...base, items: block.items };
  if (block.type === "callout") {
    return { ...base, title: block.title, text: block.text, variant: block.variant };
  }
  return { ...base, text: block.text };
}

function toBody(post: BlogPostRecord) {
  return {
    is_active: post.isActive !== false,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category_id: post.categoryId,
    cover_image: post.coverImage,
    cover_alt: post.coverAlt,
    author: post.author,
    author_role: post.authorRole,
    published_at: post.publishedAt,
    read_time: post.readTime,
    tags: post.tags,
    related_product_slugs: post.relatedProductSlugs,
    blocks: post.content.map(blockBody),
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the blog page.";
  return fallback;
}

export async function listAdminBlogPosts(): Promise<BlogPostRecord[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/posts");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the articles."));
  }
  const body = (await response.json()) as ApiPosts;
  return (body.posts ?? []).map(toPost);
}

export async function createBlogPost(post: BlogPostRecord): Promise<BlogPostRecord> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(post)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the article."));
  }
  return toPost((await response.json()) as ApiPost, 0);
}

export async function updateBlogPost(id: string, post: BlogPostRecord): Promise<BlogPostRecord> {
  const response = await authorizedFetch(`/api/v1/admin/pages/blogs/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(post)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the article."));
  }
  return toPost((await response.json()) as ApiPost, 0);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const response = await authorizedFetch(`/api/v1/admin/pages/blogs/posts/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the article."));
  }
}

export async function reorderBlogPosts(ids: string[]): Promise<BlogPostRecord[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/posts/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the articles."));
  }
  const body = (await response.json()) as ApiPosts;
  return (body.posts ?? []).map(toPost);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicBlogPosts(): Promise<BlogPostRecord[]> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/posts`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const body = (await response.json()) as ApiPosts;
    return (body.posts ?? []).map(toPost);
  } catch {
    return [];
  }
}

/** True only when the API answered 404, so an outage is not reported as a missing post. */
export async function isMissingBlogPost(slug: string): Promise<boolean> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/posts/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    return response.status === 404;
  } catch {
    return false;
  }
}

export async function getPublicBlogPost(slug: string): Promise<BlogPostRecord | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/posts/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return toPost((await response.json()) as ApiPost, 0);
  } catch {
    return null;
  }
}
