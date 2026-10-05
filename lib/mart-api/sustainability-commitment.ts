import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";
import { IMPACT_ICONS } from "@/lib/mart-api/sustainability-impact";

export type SustainabilityCommitmentCard = {
  id: string;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type SustainabilityCommitmentDraft = {
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type SustainabilityCommitment = {
  kicker: string;
  title: string;
  subtitle: string;
  items: SustainabilityCommitmentCard[];
};

type ApiItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  is_active?: boolean;
};

type ApiCommitment = {
  kicker: string;
  title: string;
  subtitle: string;
  items?: ApiItem[];
};

const ICONS = new Set<string>(IMPACT_ICONS);

export const FALLBACK_SUSTAINABILITY_COMMITMENT: SustainabilityCommitment = {
  kicker: "আমাদের অঙ্গীকার",
  title: "আমরা যেভাবে দায়িত্ব পালন করি",
  subtitle: "প্রতিটি সিদ্ধান্তে মানুষ ও পরিবেশ — দুটোকেই মাথায় রাখি।",
  items: [
    {
      id: "check",
      icon: "verified",
      title: "কোয়ালিটি চেকড",
      description: "ডেলিভারির আগে গ্যাজেট চালিয়ে, ড্রেসের ফিনিশিং দেখে যাচাই।",
      isActive: true,
    },
    {
      id: "pack",
      icon: "eco",
      title: "কম প্লাস্টিক প্যাক",
      description: "যতটা সম্ভব রিসাইক্লেবল ও কম প্লাস্টিক প্যাকেজিং।",
      isActive: true,
    },
    {
      id: "dress",
      icon: "volunteer_activism",
      title: "গর্জিয়াস ড্রেস",
      description: "হাতে তৈরি — কাস্টম মাপ ও টেকসই সেলাইয়ে।",
      isActive: true,
    },
    {
      id: "returns",
      icon: "assignment_return",
      title: "৩ দিন রিটার্ন",
      description: "সমস্যা হলে তিন দিনের মধ্যে সহজেই রিটার্ন।",
      isActive: true,
    },
  ],
};

export function commitmentIcon(icon: string) {
  return ICONS.has(icon) ? icon : "verified";
}

function toCard(body: ApiItem): SustainabilityCommitmentCard {
  return {
    id: body.id,
    icon: commitmentIcon(body.icon),
    title: body.title,
    description: body.description,
    isActive: body.is_active !== false,
  };
}

function toCommitment(body: ApiCommitment): SustainabilityCommitment {
  return {
    kicker: body.kicker,
    title: body.title,
    subtitle: body.subtitle,
    items: (body.items ?? []).map(toCard),
  };
}

function toBody(draft: SustainabilityCommitmentDraft) {
  return {
    icon: draft.icon,
    title: draft.title,
    description: draft.description,
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

export async function listSustainabilityCommitment(): Promise<SustainabilityCommitment> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/commitment",
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not load the commitment."),
    );
  }
  return toCommitment((await response.json()) as ApiCommitment);
}

export async function updateSustainabilityCommitmentCopy(copy: {
  kicker: string;
  title: string;
  subtitle: string;
}): Promise<SustainabilityCommitment> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/commitment",
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
  return toCommitment((await response.json()) as ApiCommitment);
}

export async function createSustainabilityCommitmentCard(
  draft: SustainabilityCommitmentDraft,
): Promise<SustainabilityCommitmentCard> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/commitment/items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBody(draft)),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not add the card."),
    );
  }
  return toCard((await response.json()) as ApiItem);
}

export async function updateSustainabilityCommitmentCard(
  id: string,
  draft: SustainabilityCommitmentDraft,
): Promise<SustainabilityCommitmentCard> {
  const response = await authorizedFetch(
    `/api/v1/admin/pages/sustainability/commitment/items/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBody(draft)),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the card."),
    );
  }
  return toCard((await response.json()) as ApiItem);
}

export async function deleteSustainabilityCommitmentCard(
  id: string,
): Promise<void> {
  const response = await authorizedFetch(
    `/api/v1/admin/pages/sustainability/commitment/items/${id}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not remove the card."),
    );
  }
}

export async function reorderSustainabilityCommitment(
  ids: string[],
): Promise<SustainabilityCommitment> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/commitment/items/order",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not reorder the cards."),
    );
  }
  return toCommitment((await response.json()) as ApiCommitment);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicSustainabilityCommitment(): Promise<SustainabilityCommitment | null> {
  try {
    const response = await fetch(
      `${API}/api/v1/pages/sustainability/commitment`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      },
    );
    if (!response.ok) return null;
    return toCommitment((await response.json()) as ApiCommitment);
  } catch {
    return null;
  }
}
