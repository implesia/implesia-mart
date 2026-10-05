import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type PrivacyCollectionCard = {
  id: string;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type PrivacyCollection = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  cards: PrivacyCollectionCard[];
};

type ApiCard = {
  id?: string;
  icon?: string;
  title?: string;
  description?: string;
  is_active?: boolean;
};
type ApiCollection = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  intro?: string;
  cards?: ApiCard[];
};

function toCollection(body: ApiCollection, fromAdmin: boolean): PrivacyCollection {
  return {
    isActive: fromAdmin ? body.is_active !== false : true,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    intro: body.intro ?? "",
    cards: (body.cards ?? []).map((item, index) => ({
      id: item.id ?? `card-${index + 1}`,
      icon: item.icon ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
  };
}

function toBody(block: PrivacyCollection) {
  return {
    is_active: block.isActive,
    icon: block.icon,
    nav_label: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    cards: block.cards.map((item) => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      description: item.description,
      is_active: item.isActive,
    })),
  };
}

export async function getPrivacyCollection(): Promise<PrivacyCollection> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/collection");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the collection."));
  }
  return toCollection((await response.json()) as ApiCollection, true);
}

export async function savePrivacyCollection(block: PrivacyCollection): Promise<PrivacyCollection> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/collection", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(block)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the collection."));
  }
  return toCollection((await response.json()) as ApiCollection, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicPrivacyCollection(): Promise<PrivacyCollection | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/privacy/collection`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const block = toCollection((await response.json()) as ApiCollection, false);
    if (!block.heading.trim()) return { ...block, isActive: false };
    return block;
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
  if (response.status === 401) return "Sign in again to edit the privacy page.";
  return fallback;
}
