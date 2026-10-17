import {
  MartApiError,
  authorizedFetch,
  fileFromSrc,
  isLocalImage,
  mediaUrl,
  sitePath,
} from "@/lib/mart-api/products";

export type CategoryTile = {
  id: string;
  label: string;
  href: string;
  imageSrc: string;
  isActive: boolean;
};

export type CategoryDraft = {
  label: string;
  href: string;
  imageSrc: string;
  isActive: boolean;
};

export type CategorySection = {
  heading: string;
  tiles: CategoryTile[];
};

type ApiTile = {
  id: string;
  label: string;
  href: string;
  image_src: string;
  is_active?: boolean;
};

type ApiSection = {
  heading: string;
  tiles: ApiTile[];
};

export const FALLBACK_CATEGORIES: CategorySection = {
  heading: "ক্যাটাগরি",
  tiles: [
    {
      id: "gadgets",
      label: "ট্রেন্ডিং গ্যাজেট",
      href: "/products?category=gadgets",
      imageSrc: "/images/products/lamp/lamp-5.jpg",
      isActive: true,
    },
    {
      id: "fashion",
      label: "গর্জিয়াস ড্রেস",
      href: "/products?category=fashion",
      imageSrc: "/images/products/baby-products/wedding-dress.jpeg",
      isActive: true,
    },
  ],
};

export function blankCategoryDraft(): CategoryDraft {
  return { label: "", href: "/products", imageSrc: "", isActive: true };
}

export function categoryImage(src: string) {
  return mediaUrl(src);
}

function toTile(body: ApiTile): CategoryTile {
  return {
    id: body.id,
    label: body.label,
    href: body.href,
    imageSrc: body.image_src,
    isActive: body.is_active !== false,
  };
}

function toSection(body: ApiSection): CategorySection {
  return { heading: body.heading, tiles: body.tiles.map(toTile) };
}

async function tileForm(draft: CategoryDraft) {
  const local = isLocalImage(draft.imageSrc);
  const body = new FormData();
  body.set(
    "payload",
    JSON.stringify({
      label: draft.label,
      href: draft.href,
      image_src: local ? "" : sitePath(draft.imageSrc),
      is_active: draft.isActive,
    }),
  );
  if (local) body.set("image", await fileFromSrc(draft.imageSrc, "category"));
  return body;
}

export async function getCategorySection(): Promise<CategorySection> {
  const response = await authorizedFetch("/api/v1/admin/home/categories");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load categories."));
  }
  return toSection((await response.json()) as ApiSection);
}

export async function updateCategoryHeading(heading: string): Promise<CategorySection> {
  const response = await authorizedFetch("/api/v1/admin/home/categories", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heading }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the heading."));
  }
  return toSection((await response.json()) as ApiSection);
}

export async function createCategoryTile(draft: CategoryDraft): Promise<CategoryTile> {
  const response = await authorizedFetch("/api/v1/admin/home/categories/tiles", {
    method: "POST",
    body: await tileForm(draft),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the category."));
  }
  return toTile((await response.json()) as ApiTile);
}

export async function updateCategoryTile(id: string, draft: CategoryDraft): Promise<CategoryTile> {
  const response = await authorizedFetch(`/api/v1/admin/home/categories/tiles/${id}`, {
    method: "PATCH",
    body: await tileForm(draft),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the category."));
  }
  return toTile((await response.json()) as ApiTile);
}

export async function deleteCategoryTile(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/home/categories/tiles/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the category."));
  }
}

export async function reorderCategoryTiles(ids: string[]): Promise<CategorySection> {
  const response = await authorizedFetch("/api/v1/admin/home/categories/tiles/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the categories."));
  }
  return toSection((await response.json()) as ApiSection);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicCategories(): Promise<CategorySection | null> {
  try {
    const response = await fetch(`${API}/api/v1/home/categories`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiSection;
    return {
      heading: body.heading,
      tiles: (body.tiles ?? []).map((tile) => ({
        ...toTile(tile),
        imageSrc: categoryImage(tile.image_src),
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
  if (response.status === 401) return "Sign in again to edit categories.";
  return fallback;
}
