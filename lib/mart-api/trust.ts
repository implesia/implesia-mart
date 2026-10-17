import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export const TRUST_ICONS = [
  "payments",
  "local_shipping",
  "assignment_return",
  "verified",
  "local_offer",
  "campaign",
  "shield",
  "support_agent",
  "schedule",
] as const;

export type TrustIcon = (typeof TRUST_ICONS)[number];

export type TrustBenefit = {
  id: string;
  icon: TrustIcon;
  label: string;
  href: string;
  isActive: boolean;
};

export type TrustDraft = {
  icon: TrustIcon;
  label: string;
  href: string;
  isActive: boolean;
};

type ApiBenefit = {
  id: string;
  icon: string;
  label: string;
  href: string;
  is_active?: boolean;
};

const ICONS = new Set<string>(TRUST_ICONS);

export const FALLBACK_TRUST: TrustBenefit[] = [
  { id: "cod", icon: "payments", label: "ক্যাশ অন ডেলিভারি", href: "/shipping-returns", isActive: true },
  {
    id: "delivery",
    icon: "local_shipping",
    label: "সারাদেশে ডেলিভারি",
    href: "/shipping-returns",
    isActive: true,
  },
  {
    id: "returns",
    icon: "assignment_return",
    label: "৩ দিন ইজি রিটার্ন",
    href: "/shipping-returns",
    isActive: true,
  },
];

export function blankTrustDraft(): TrustDraft {
  return { icon: "verified", label: "", href: "/shipping-returns", isActive: true };
}

function iconOf(value: string): TrustIcon {
  return ICONS.has(value) ? (value as TrustIcon) : "verified";
}

function toBenefit(body: ApiBenefit): TrustBenefit {
  return {
    id: body.id,
    icon: iconOf(body.icon),
    label: body.label,
    href: body.href,
    isActive: body.is_active !== false,
  };
}

function toBody(draft: TrustDraft) {
  return {
    icon: draft.icon,
    label: draft.label,
    href: draft.href,
    is_active: draft.isActive,
  };
}

export async function listTrustBenefits(): Promise<TrustBenefit[]> {
  const response = await authorizedFetch("/api/v1/admin/home/trust");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load trust benefits."));
  }
  const body = (await response.json()) as ApiBenefit[];
  return body.map(toBenefit);
}

export async function createTrustBenefit(draft: TrustDraft): Promise<TrustBenefit> {
  const response = await authorizedFetch("/api/v1/admin/home/trust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the benefit."));
  }
  return toBenefit((await response.json()) as ApiBenefit);
}

export async function updateTrustBenefit(id: string, draft: TrustDraft): Promise<TrustBenefit> {
  const response = await authorizedFetch(`/api/v1/admin/home/trust/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the benefit."));
  }
  return toBenefit((await response.json()) as ApiBenefit);
}

export async function deleteTrustBenefit(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/home/trust/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the benefit."));
  }
}

export async function reorderTrustBenefits(ids: string[]): Promise<TrustBenefit[]> {
  const response = await authorizedFetch("/api/v1/admin/home/trust/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the benefits."));
  }
  const body = (await response.json()) as ApiBenefit[];
  return body.map(toBenefit);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicTrustBenefits(): Promise<TrustBenefit[] | null> {
  try {
    const response = await fetch(`${API}/api/v1/home/trust`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { items?: ApiBenefit[] };
    return (body.items ?? []).map(toBenefit);
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
  if (response.status === 401) return "Sign in again to edit trust benefits.";
  return fallback;
}
