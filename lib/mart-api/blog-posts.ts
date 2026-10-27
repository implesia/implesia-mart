import type { BlogBlock, BlogPostRecord } from "@/lib/mart-mock/blog-sections";
import { MartApiError, authorizedFetch, fileFromSrc } from "@/lib/mart-api/products";

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
  seo_title?: string;
  seo_description?: string;
  cover_needs_upload?: boolean;
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
    seoTitle: body.seo_title ?? "",
    seoDescription: body.seo_description ?? "",
    coverNeedsUpload: body.cover_needs_upload === true,
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
    seo_title: post.seoTitle,
    seo_description: post.seoDescription,
    author: post.author,
    author_role: post.authorRole,
    published_at: post.publishedAt,
    read_time: post.readTime,
    tags: post.tags,
    related_product_slugs: post.relatedProductSlugs,
    blocks: post.content.map(blockBody),
  };
}

/** A failed blog call: the HTTP status (0 = never reached the API) and the API's field details. */
export class BlogApiError extends MartApiError {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "BlogApiError";
    this.status = status;
    this.details = details;
  }
}

async function failure(response: Response, fallback: string) {
  let message = "";
  let details: unknown = null;
  try {
    const parsed = (await response.json()) as { error?: { message?: string; details?: unknown } };
    message = parsed.error?.message ?? "";
    details = parsed.error?.details ?? null;
  } catch {
    /* not the API envelope */
  }
  if (!message) {
    message = response.status === 401 ? "Sign in again to edit the blog page." : fallback;
  }
  return new BlogApiError(message, response.status, details);
}

/** `authorizedFetch`, but a dropped connection becomes a status-0 error with an actionable text. */
async function send(path: string, init?: RequestInit) {
  try {
    return await authorizedFetch(path, init);
  } catch (error) {
    if (error instanceof BlogApiError) throw error;
    throw new BlogApiError(
      "Could not reach the server. Your entries are kept. Check your connection and try again.",
      0,
    );
  }
}

/** Sends a chosen cover (a blob: preview) to the media store and returns its `/media/blogs/..` path. */
export async function uploadBlogCover(src: string): Promise<string> {
  const file = await fileFromSrc(src, "cover");
  const form = new FormData();
  form.append("image", file);
  const response = await send("/api/v1/admin/pages/blogs/posts/cover", {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw await failure(response, "Could not upload the cover photo.");
  }
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new BlogApiError("Could not upload the cover photo.", 200);
  return body.url;
}

export async function listAdminBlogPosts(): Promise<BlogPostRecord[]> {
  const response = await send("/api/v1/admin/pages/blogs/posts");
  if (!response.ok) {
    throw await failure(response, "Could not load the articles.");
  }
  const body = (await response.json()) as ApiPosts;
  return (body.posts ?? []).map(toPost);
}

export async function createBlogPost(post: BlogPostRecord): Promise<BlogPostRecord> {
  const response = await send("/api/v1/admin/pages/blogs/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(post)),
  });
  if (!response.ok) {
    throw await failure(response, "Could not save the article.");
  }
  return toPost((await response.json()) as ApiPost, 0);
}

export async function updateBlogPost(id: string, post: BlogPostRecord): Promise<BlogPostRecord> {
  const response = await send(`/api/v1/admin/pages/blogs/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(post)),
  });
  if (!response.ok) {
    throw await failure(response, "Could not save the article.");
  }
  return toPost((await response.json()) as ApiPost, 0);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const response = await send(`/api/v1/admin/pages/blogs/posts/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw await failure(response, "Could not remove the article.");
  }
}

export async function reorderBlogPosts(ids: string[]): Promise<BlogPostRecord[]> {
  const response = await send("/api/v1/admin/pages/blogs/posts/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw await failure(response, "Could not reorder the articles.");
  }
  const body = (await response.json()) as ApiPosts;
  return (body.posts ?? []).map(toPost);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

/** Published posts, plus whether the API answered, so an outage is not shown as "no posts". */
export async function fetchPublicBlogPosts(): Promise<{ posts: BlogPostRecord[]; failed: boolean }> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/posts`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      // A hung API must end in the error state, not an endless skeleton.
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { posts: [], failed: true };
    const body = (await response.json()) as ApiPosts;
    return { posts: (body.posts ?? []).map(toPost), failed: false };
  } catch {
    return { posts: [], failed: true };
  }
}

export async function listPublicBlogPosts(): Promise<BlogPostRecord[]> {
  return (await fetchPublicBlogPosts()).posts;
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
