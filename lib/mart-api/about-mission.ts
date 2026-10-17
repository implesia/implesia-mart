import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export const MISSION_ICONS = [
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

export type MissionCardKey = "vision" | "mission";

export type AboutMissionCard = {
  id: string;
  key: MissionCardKey;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type AboutMissionDraft = {
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

type ApiCard = {
  id: string;
  key: MissionCardKey;
  icon: string;
  title: string;
  description: string;
  is_active?: boolean;
};

const ICONS = new Set<string>(MISSION_ICONS);

const VISION_DESCRIPTION =
  "বাংলাদেশের সবচেয়ে বিশ্বাসযোগ্য অনলাইন শপিং ডেস্টিনেশন হয়ে ওঠা — যেখানে প্রতিটি ক্যাটাগরির প্রতিটি অর্ডার মানেই নিশ্চিন্ত, ঝুঁকিমুক্ত অভিজ্ঞতা।";

const MISSION_DESCRIPTION =
  "কোয়ালিটি চেক করা প্রোডাক্ট সহজলভ্য দামে, ক্যাশ অন ডেলিভারিতে এবং সহজ রিটার্ন সুবিধায় সারাদেশে পৌঁছে দেওয়া — আজ ট্রেন্ডিং গ্যাজেট দিয়ে শুরু, আগামীতে আরও অনেক ক্যাটাগরি।";

export const FALLBACK_ABOUT_MISSION: AboutMissionCard[] = [
  {
    id: "vision",
    key: "vision",
    icon: "visibility",
    title: "আমাদের ভিশন",
    description: VISION_DESCRIPTION,
    isActive: true,
  },
  {
    id: "mission",
    key: "mission",
    icon: "rocket_launch",
    title: "আমাদের মিশন",
    description: MISSION_DESCRIPTION,
    isActive: true,
  },
];

export function missionIcon(icon: string) {
  return ICONS.has(icon) ? icon : "verified";
}

function toCard(body: ApiCard): AboutMissionCard {
  return {
    id: body.id,
    key: body.key,
    icon: body.icon,
    title: body.title,
    description: body.description,
    isActive: body.is_active !== false,
  };
}

function toBody(draft: AboutMissionDraft) {
  return {
    icon: draft.icon,
    title: draft.title,
    description: draft.description,
    is_active: draft.isActive,
  };
}

export async function listAboutMission(): Promise<AboutMissionCard[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/mission");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the cards."));
  }
  const body = (await response.json()) as ApiCard[];
  return body.map(toCard);
}

export async function updateAboutMissionCard(
  key: MissionCardKey,
  draft: AboutMissionDraft,
): Promise<AboutMissionCard> {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/mission/${key}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the card."));
  }
  return toCard((await response.json()) as ApiCard);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicAboutMission(): Promise<AboutMissionCard[] | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/about/mission`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { items?: ApiCard[] };
    return (body.items ?? []).map((item) => ({
      ...toCard(item),
      icon: missionIcon(item.icon),
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
