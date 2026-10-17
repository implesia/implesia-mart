import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export const VALUE_ICONS = [
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

export type AboutValue = {
  id: string;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type AboutValueDraft = {
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type AboutValues = {
  kicker: string;
  title: string;
  subtitle: string;
  items: AboutValue[];
};

type ApiItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  is_active?: boolean;
};

type ApiValues = {
  kicker: string;
  title: string;
  subtitle: string;
  items?: ApiItem[];
};

const ICONS = new Set<string>(VALUE_ICONS);

export const FALLBACK_ABOUT_VALUES: AboutValues = {
  kicker: "আমাদের মূলনীতি",
  title: "যেভাবে আমরা কাজ করি",
  subtitle: "প্রতিটি সিদ্ধান্তে আমরা এই চারটি মূলনীতি মেনে চলি।",
  items: [
    {
      id: "quality",
      icon: "verified",
      title: "কোয়ালিটি চেকড",
      description: "ডেলিভারির আগে প্রতিটি প্রোডাক্ট চালিয়ে পরীক্ষা করা হয়।",
      isActive: true,
    },
    {
      id: "cod",
      icon: "payments",
      title: "ক্যাশ অন ডেলিভারি",
      description: "আগে টাকা লাগবে না — হাতে পেয়ে, দেখে তারপর পেমেন্ট।",
      isActive: true,
    },
    {
      id: "delivery",
      icon: "local_shipping",
      title: "সারাদেশে ডেলিভারি",
      description: "ঢাকা থেকে দূরের জেলা — সবখানে দ্রুত পৌঁছে যায়।",
      isActive: true,
    },
    {
      id: "returns",
      icon: "assignment_return",
      title: "সহজ রিটার্ন",
      description: "সমস্যা হলে ৩ দিনের মধ্যে সহজেই রিটার্ন করা যায়।",
      isActive: true,
    },
  ],
};

export function blankAboutValue(): AboutValueDraft {
  return { icon: "verified", title: "", description: "", isActive: true };
}

export function valueIcon(icon: string) {
  return ICONS.has(icon) ? icon : "verified";
}

function toItem(body: ApiItem): AboutValue {
  return {
    id: body.id,
    icon: body.icon,
    title: body.title,
    description: body.description,
    isActive: body.is_active !== false,
  };
}

function toSection(body: ApiValues): AboutValues {
  return {
    kicker: body.kicker,
    title: body.title,
    subtitle: body.subtitle,
    items: (body.items ?? []).map(toItem),
  };
}

function toBody(draft: AboutValueDraft) {
  return {
    icon: draft.icon,
    title: draft.title,
    description: draft.description,
    is_active: draft.isActive,
  };
}

export async function listAboutValues(): Promise<AboutValues> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/values");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the values."));
  }
  return toSection((await response.json()) as ApiValues);
}

export async function updateAboutValuesCopy(copy: {
  kicker: string;
  title: string;
  subtitle: string;
}): Promise<AboutValues> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/values", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(copy),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the heading."));
  }
  return toSection((await response.json()) as ApiValues);
}

export async function createAboutValue(draft: AboutValueDraft): Promise<AboutValue> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/values/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the value."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function updateAboutValue(id: string, draft: AboutValueDraft): Promise<AboutValue> {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/values/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the value."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function deleteAboutValue(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/values/items/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the value."));
  }
}

export async function reorderAboutValues(ids: string[]): Promise<AboutValues> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/values/items/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the values."));
  }
  return toSection((await response.json()) as ApiValues);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicAboutValues(): Promise<AboutValues | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/about/values`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiValues;
    const section = toSection(body);
    return {
      ...section,
      items: section.items.map((item) => ({ ...item, icon: valueIcon(item.icon) })),
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
  if (response.status === 401) return "Sign in again to edit the about page.";
  return fallback;
}
