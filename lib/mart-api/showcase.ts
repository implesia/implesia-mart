import type { Product, ProductCategoryId } from "@/app/(client)/_data/products/products";
import { categoryLabels } from "@/app/(client)/_data/products/products";
import type { FeaturedProduct } from "@/lib/mart-api/featured";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ShowcaseItem = {
  id: string;
  productId: string;
  product: FeaturedProduct | null;
};

export type ShowcaseRow = {
  id: string;
  key: ProductCategoryId;
  heading: string;
  href: string;
  items: ShowcaseItem[];
  choices: FeaturedProduct[];
};

export type ShowcaseSection = {
  rows: ShowcaseRow[];
};

export type ShowcasePublicRow = {
  key: string;
  heading: string;
  href: string;
  productIds: string[];
};

export type ShowcasePublic = {
  rows: ShowcasePublicRow[];
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

type ApiRow = {
  id: string;
  key: ProductCategoryId;
  heading: string;
  href: string;
  items: ApiItem[];
  choices: ApiProduct[];
};

type ApiPublicRow = {
  key: string;
  heading: string;
  href: string;
  product_ids: string[];
};

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export function fallbackShowcase(products: Product[]): ShowcasePublic {
  return {
    rows: (["gadgets", "fashion"] as const).map((key) => ({
      key,
      heading: categoryLabels[key],
      href: `/products?category=${key}`,
      productIds: products
        .filter((product) => product.categoryId === key)
        .slice(0, 4)
        .map((product) => product.id),
    })),
  };
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

function toItem(body: ApiItem): ShowcaseItem {
  return {
    id: body.id,
    productId: body.product_id,
    product: body.product ? toProduct(body.product) : null,
  };
}

function toSection(body: { rows: ApiRow[] }): ShowcaseSection {
  return {
    rows: body.rows.map((row) => ({
      id: row.id,
      key: row.key,
      heading: row.heading,
      href: row.href,
      items: row.items.map(toItem),
      choices: row.choices.map(toProduct),
    })),
  };
}

export async function getShowcaseSection(): Promise<ShowcaseSection> {
  const response = await authorizedFetch("/api/v1/admin/home/showcase");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the showcase."));
  }
  return toSection((await response.json()) as { rows: ApiRow[] });
}

export async function updateShowcaseRow(
  key: string,
  copy: { heading: string; href: string },
): Promise<ShowcaseSection> {
  const response = await authorizedFetch(`/api/v1/admin/home/showcase/rows/${key}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(copy),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the heading."));
  }
  return toSection((await response.json()) as { rows: ApiRow[] });
}

export async function createShowcaseItem(key: string, productId: string): Promise<ShowcaseItem> {
  const response = await authorizedFetch(`/api/v1/admin/home/showcase/rows/${key}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not add the product."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function updateShowcaseItem(
  key: string,
  id: string,
  productId: string,
): Promise<ShowcaseItem> {
  const response = await authorizedFetch(`/api/v1/admin/home/showcase/rows/${key}/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the product."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function deleteShowcaseItem(key: string, id: string) {
  const response = await authorizedFetch(`/api/v1/admin/home/showcase/rows/${key}/items/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the product."));
  }
}

export async function reorderShowcaseItems(key: string, ids: string[]): Promise<ShowcaseSection> {
  const response = await authorizedFetch(`/api/v1/admin/home/showcase/rows/${key}/items/order`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the products."));
  }
  return toSection((await response.json()) as { rows: ApiRow[] });
}

export async function listPublicShowcase(): Promise<ShowcasePublic | null> {
  try {
    const response = await fetch(`${API}/api/v1/home/showcase`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { rows: ApiPublicRow[] };
    return {
      rows: (body.rows ?? []).map((row) => ({
        key: row.key,
        heading: row.heading,
        href: row.href,
        productIds: row.product_ids ?? [],
      })),
    };
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
  if (response.status === 401) return "Sign in again to edit the showcase.";
  return fallback;
}
