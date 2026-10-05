import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export const IMPACT_ICONS = [
  "payments",
  "local_shipping",
  "assignment_return",
  "verified",
  "eco",
  "check_circle",
  "volunteer_activism",
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

export type SustainabilityImpactStat = {
  id: string;
  icon: string;
  value: string;
  label: string;
  isActive: boolean;
};

export type SustainabilityImpactDraft = {
  icon: string;
  value: string;
  label: string;
  isActive: boolean;
};

export type SustainabilityImpact = {
  kicker: string;
  title: string;
  subtitle: string;
  items: SustainabilityImpactStat[];
};

type ApiItem = {
  id: string;
  icon: string;
  value: string;
  label: string;
  is_active?: boolean;
};

type ApiImpact = {
  kicker: string;
  title: string;
  subtitle: string;
  items?: ApiItem[];
};

const ICONS = new Set<string>(IMPACT_ICONS);

export const FALLBACK_SUSTAINABILITY_IMPACT: SustainabilityImpact = {
  kicker: "আমাদের অভ্যাস",
  title: "যা আমরা প্রতিদিন মেনে চলি",
  subtitle: "বড় সংখ্যা নয় — যাচাই করা প্রক্রিয়া।",
  items: [
    {
      id: "cod",
      icon: "payments",
      value: "COD",
      label: "ক্যাশ অন ডেলিভারি",
      isActive: true,
    },
    {
      id: "returns",
      icon: "assignment_return",
      value: "৩ দিন",
      label: "ইজি রিটার্ন",
      isActive: true,
    },
    {
      id: "check",
      icon: "verified",
      value: "চেক",
      label: "পাঠানোর আগে যাচাই",
      isActive: true,
    },
    {
      id: "pack",
      icon: "eco",
      value: "কম",
      label: "প্লাস্টিক প্যাক",
      isActive: true,
    },
  ],
};

export function impactIcon(icon: string) {
  return ICONS.has(icon) ? icon : "verified";
}

function toStat(body: ApiItem): SustainabilityImpactStat {
  return {
    id: body.id,
    icon: impactIcon(body.icon),
    value: body.value,
    label: body.label,
    isActive: body.is_active !== false,
  };
}

function toImpact(body: ApiImpact): SustainabilityImpact {
  return {
    kicker: body.kicker,
    title: body.title,
    subtitle: body.subtitle,
    items: (body.items ?? []).map(toStat),
  };
}

function toBody(draft: SustainabilityImpactDraft) {
  return {
    icon: draft.icon,
    value: draft.value,
    label: draft.label,
    is_active: draft.isActive,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401)
    return "Sign in again to edit the sustainability page.";
  return fallback;
}

export async function listSustainabilityImpact(): Promise<SustainabilityImpact> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/impact",
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not load the habits."),
    );
  }
  return toImpact((await response.json()) as ApiImpact);
}

export async function updateSustainabilityImpactCopy(copy: {
  kicker: string;
  title: string;
  subtitle: string;
}): Promise<SustainabilityImpact> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/impact",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copy),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the heading."),
    );
  }
  return toImpact((await response.json()) as ApiImpact);
}

export async function createSustainabilityImpactStat(
  draft: SustainabilityImpactDraft,
): Promise<SustainabilityImpactStat> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/impact/items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBody(draft)),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not add the stat."),
    );
  }
  return toStat((await response.json()) as ApiItem);
}

export async function updateSustainabilityImpactStat(
  id: string,
  draft: SustainabilityImpactDraft,
): Promise<SustainabilityImpactStat> {
  const response = await authorizedFetch(
    `/api/v1/admin/pages/sustainability/impact/items/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBody(draft)),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the stat."),
    );
  }
  return toStat((await response.json()) as ApiItem);
}

export async function deleteSustainabilityImpactStat(
  id: string,
): Promise<void> {
  const response = await authorizedFetch(
    `/api/v1/admin/pages/sustainability/impact/items/${id}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not remove the stat."),
    );
  }
}

export async function reorderSustainabilityImpact(
  ids: string[],
): Promise<SustainabilityImpact> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/impact/items/order",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not reorder the stats."),
    );
  }
  return toImpact((await response.json()) as ApiImpact);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicSustainabilityImpact(): Promise<SustainabilityImpact | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/sustainability/impact`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return toImpact((await response.json()) as ApiImpact);
  } catch {
    return null;
  }
}
