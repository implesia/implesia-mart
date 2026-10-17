import { MartApiError, authorizedFetch, mediaUrl } from "@/lib/mart-api/products";
import type { Product } from "@/app/(client)/_data/products/products";

export type FeaturedProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  imageSrc: string;
  published: boolean;
};

export type FeaturedItem = {
  id: string;
  productId: string;
  product: FeaturedProduct | null;
};

export type FeaturedSection = {
  heading: string;
  viewAllLabel: string;
  viewAllHref: string;
  items: FeaturedItem[];
  choices: FeaturedProduct[];
};

export type FeaturedPublic = {
  heading: string;
  viewAllLabel: string;
  viewAllHref: string;
  productIds: string[];
};

type ApiProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image_src: string;
  published: boolean;
};

type ApiItem = {
  id: string;
  product_id: string;
  product: ApiProduct | null;
};

type ApiSection = {
  heading: string;
  view_all_label: string;
  view_all_href: string;
  items: ApiItem[];
  choices: ApiProduct[];
};

type ApiPublic = {
  heading: string;
  view_all_label: string;
  view_all_href: string;
  product_ids: string[];
};

export function featuredImage(src: string) {
  return mediaUrl(src);
}

export function fallbackFeatured(products: Product[]): FeaturedPublic {
  const flagged = products.filter((product) => product.featured);
  const picks = (flagged.length > 0 ? flagged : products).slice(0, 4);
  return {
    heading: "Featured Products",
    viewAllLabel: "View All",
    viewAllHref: "/products?view=featured",
    productIds: picks.map((product) => product.id),
  };
}

/** A saved featured list wins. An empty list means nothing was pinned yet. */
export function featuredForStore(
  curated: FeaturedPublic | null,
  products: Product[],
  unavailable: boolean,
): FeaturedPublic | null {
  if (curated && curated.productIds.length > 0) return curated;
  if (unavailable) return null;
  const fallback = fallbackFeatured(products);
  return fallback.productIds.length > 0 ? fallback : null;
}

function toProduct(body: ApiProduct): FeaturedProduct {
  return {
    id: body.id,
    slug: body.slug,
    title: body.title,
    price: body.price,
    imageSrc: body.image_src,
    published: body.published,
  };
}

function toSection(body: ApiSection): FeaturedSection {
  return {
    heading: body.heading,
    viewAllLabel: body.view_all_label,
    viewAllHref: body.view_all_href,
    items: body.items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      product: item.product ? toProduct(item.product) : null,
    })),
    choices: body.choices.map(toProduct),
  };
}

export async function getFeaturedSection(): Promise<FeaturedSection> {
  const response = await authorizedFetch("/api/v1/admin/home/featured");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load featured products."));
  }
  return toSection((await response.json()) as ApiSection);
}

export async function updateFeaturedCopy(copy: {
  heading: string;
  viewAllLabel: string;
  viewAllHref: string;
}): Promise<FeaturedSection> {
  const response = await authorizedFetch("/api/v1/admin/home/featured", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      heading: copy.heading,
      view_all_label: copy.viewAllLabel,
      view_all_href: copy.viewAllHref,
    }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the heading."));
  }
  return toSection((await response.json()) as ApiSection);
}

export async function createFeaturedItem(productId: string): Promise<FeaturedItem> {
  const response = await authorizedFetch("/api/v1/admin/home/featured/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not feature the product."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function updateFeaturedItem(id: string, productId: string): Promise<FeaturedItem> {
  const response = await authorizedFetch(`/api/v1/admin/home/featured/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the product."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function deleteFeaturedItem(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/home/featured/items/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the product."));
  }
}

export async function reorderFeaturedItems(ids: string[]): Promise<FeaturedSection> {
  const response = await authorizedFetch("/api/v1/admin/home/featured/items/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the products."));
  }
  return toSection((await response.json()) as ApiSection);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicFeatured(): Promise<FeaturedPublic | null> {
  try {
    const response = await fetch(`${API}/api/v1/home/featured`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiPublic;
    return {
      heading: body.heading,
      viewAllLabel: body.view_all_label,
      viewAllHref: body.view_all_href,
      productIds: body.product_ids ?? [],
    };
  } catch {
    return null;
  }
}

function toItem(body: ApiItem): FeaturedItem {
  return {
    id: body.id,
    productId: body.product_id,
    product: body.product ? toProduct(body.product) : null,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit featured products.";
  return fallback;
}
