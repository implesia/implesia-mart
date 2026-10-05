import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type BlogRelated = {
  isActive: boolean;
  tocTitle: string;
  productsTitle: string;
  productsSubtitle: string;
  postsTitle: string;
  postsSubtitle: string;
  postsLinkLabel: string;
  comingSoonLabel: string;
  viewLabel: string;
  detailsLabel: string;
};

type ApiRelated = {
  is_active?: boolean;
  toc_title?: string;
  products_title?: string;
  products_subtitle?: string;
  posts_title?: string;
  posts_subtitle?: string;
  posts_link_label?: string;
  coming_soon_label?: string;
  view_label?: string;
  details_label?: string;
};

function toRelated(body: ApiRelated, active: boolean): BlogRelated {
  return {
    isActive: active,
    tocTitle: body.toc_title ?? "",
    productsTitle: body.products_title ?? "",
    productsSubtitle: body.products_subtitle ?? "",
    postsTitle: body.posts_title ?? "",
    postsSubtitle: body.posts_subtitle ?? "",
    postsLinkLabel: body.posts_link_label ?? "",
    comingSoonLabel: body.coming_soon_label ?? "",
    viewLabel: body.view_label ?? "",
    detailsLabel: body.details_label ?? "",
  };
}

function toBody(related: BlogRelated) {
  return {
    is_active: related.isActive,
    toc_title: related.tocTitle,
    products_title: related.productsTitle,
    products_subtitle: related.productsSubtitle,
    posts_title: related.postsTitle,
    posts_subtitle: related.postsSubtitle,
    posts_link_label: related.postsLinkLabel,
    coming_soon_label: related.comingSoonLabel,
    view_label: related.viewLabel,
    details_label: related.detailsLabel,
  };
}

export function blogRelatedHasCopy(related: BlogRelated) {
  return [
    related.tocTitle,
    related.productsTitle,
    related.productsSubtitle,
    related.postsTitle,
    related.postsSubtitle,
    related.postsLinkLabel,
    related.comingSoonLabel,
    related.viewLabel,
    related.detailsLabel,
  ].some((value) => value.trim());
}

export async function getBlogRelated(): Promise<BlogRelated> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/related");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the related labels."));
  }
  const body = (await response.json()) as ApiRelated;
  return toRelated(body, body.is_active !== false);
}

export async function saveBlogRelated(related: BlogRelated): Promise<BlogRelated> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/related", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(related)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the related labels."));
  }
  const body = (await response.json()) as ApiRelated;
  return toRelated(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicBlogRelated(): Promise<BlogRelated | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/related`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const related = toRelated((await response.json()) as ApiRelated, true);
    if (!blogRelatedHasCopy(related)) return { ...related, isActive: false };
    return related;
  } catch {
    return null;
  }
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
