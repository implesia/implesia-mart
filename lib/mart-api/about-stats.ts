import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export const STAT_ICONS = [
  "payments",
  "local_shipping",
  "assignment_return",
  "verified",
  "category",
  "location_on",
  "design_services",
  "back_hand",
  "checkroom",
  "visibility",
  "rocket_launch",
  "search",
  "task_alt",
  "storefront",
  "support_agent",
  "favorite",
  "shield",
] as const;

export type StatIcon = (typeof STAT_ICONS)[number];

export type AboutStat = {
  id: string;
  icon: string;
  value: string;
  label: string;
  isActive: boolean;
};

export type AboutStatDraft = {
  icon: string;
  value: string;
  label: string;
  isActive: boolean;
};

type ApiStat = {
  id: string;
  icon: string;
  value: string;
  label: string;
  is_active?: boolean;
};

const ICONS = new Set<string>(STAT_ICONS);

export const FALLBACK_ABOUT_STATS: AboutStat[] = [
  { id: "categories", icon: "category", value: "২", label: "ক্যাটাগরি", isActive: true },
  { id: "districts", icon: "location_on", value: "৬৪", label: "জেলায় ডেলিভারি", isActive: true },
  { id: "cod", icon: "payments", value: "COD", label: "ক্যাশ অন ডেলিভারি", isActive: true },
  { id: "returns", icon: "assignment_return", value: "৩ দিন", label: "ইজি রিটার্ন", isActive: true },
];

export function blankAboutStat(): AboutStatDraft {
  return { icon: "verified", value: "", label: "", isActive: true };
}

export function statIcon(icon: string) {
  return ICONS.has(icon) ? icon : "verified";
}

function toStat(body: ApiStat): AboutStat {
  return {
    id: body.id,
    icon: body.icon,
    value: body.value,
    label: body.label,
    isActive: body.is_active !== false,
  };
}

function toBody(draft: AboutStatDraft) {
  return {
    icon: draft.icon,
    value: draft.value,
    label: draft.label,
    is_active: draft.isActive,
  };
}

export async function listAboutStats(): Promise<AboutStat[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/stats");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the stats."));
  }
  const body = (await response.json()) as ApiStat[];
  return body.map(toStat);
}

export async function createAboutStat(draft: AboutStatDraft): Promise<AboutStat> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the stat."));
  }
  return toStat((await response.json()) as ApiStat);
}

export async function updateAboutStat(id: string, draft: AboutStatDraft): Promise<AboutStat> {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/stats/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the stat."));
  }
  return toStat((await response.json()) as ApiStat);
}

export async function deleteAboutStat(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/stats/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the stat."));
  }
}

export async function reorderAboutStats(ids: string[]): Promise<AboutStat[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/stats/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the stats."));
  }
  const body = (await response.json()) as ApiStat[];
  return body.map(toStat);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicAboutStats(): Promise<AboutStat[] | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/about/stats`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { items?: ApiStat[] };
    return (body.items ?? []).map((item) => ({
      ...toStat(item),
      icon: statIcon(item.icon),
    }));
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
  if (response.status === 401) return "Sign in again to edit the about page.";
  return fallback;
}
