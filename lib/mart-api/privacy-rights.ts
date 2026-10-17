import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type PrivacyRightItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type PrivacyNote = {
  isActive: boolean;
  title: string;
  body: string;
};

export type PrivacyRights = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  items: PrivacyRightItem[];
  retention: PrivacyNote;
  updates: PrivacyNote;
};

type ApiItem = {
  id?: string;
  icon?: string;
  title?: string;
  description?: string;
  is_active?: boolean;
};
type ApiNote = { is_active?: boolean; title?: string; body?: string };
type ApiRights = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  intro?: string;
  items?: ApiItem[];
  retention?: ApiNote;
  updates?: ApiNote;
};

function toNote(note: ApiNote | undefined, fromAdmin: boolean): PrivacyNote {
  const title = note?.title ?? "";
  const body = note?.body ?? "";
  return {
    isActive: fromAdmin ? note?.is_active !== false : Boolean(title.trim() || body.trim()),
    title,
    body,
  };
}

function toRights(body: ApiRights, fromAdmin: boolean): PrivacyRights {
  return {
    isActive: fromAdmin ? body.is_active !== false : true,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    intro: body.intro ?? "",
    items: (body.items ?? []).map((item, index) => ({
      id: item.id ?? `right-${index + 1}`,
      icon: item.icon ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
    retention: toNote(body.retention, fromAdmin),
    updates: toNote(body.updates, fromAdmin),
  };
}

function toBody(block: PrivacyRights) {
  return {
    is_active: block.isActive,
    icon: block.icon,
    nav_label: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    items: block.items.map((item) => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      description: item.description,
      is_active: item.isActive,
    })),
    retention: {
      is_active: block.retention.isActive,
      title: block.retention.title,
      body: block.retention.body,
    },
    updates: {
      is_active: block.updates.isActive,
      title: block.updates.title,
      body: block.updates.body,
    },
  };
}

export async function getPrivacyRights(): Promise<PrivacyRights> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/rights");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the rights section."));
  }
  return toRights((await response.json()) as ApiRights, true);
}

export async function savePrivacyRights(block: PrivacyRights): Promise<PrivacyRights> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/rights", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(block)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the rights section."));
  }
  return toRights((await response.json()) as ApiRights, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicPrivacyRights(): Promise<PrivacyRights | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/privacy/rights`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const block = toRights((await response.json()) as ApiRights, false);
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
