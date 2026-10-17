import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type PrivacyUseItem = {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type PrivacyBadge = {
  id: string;
  icon: string;
  label: string;
  isActive: boolean;
};

export type PrivacyUsage = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  items: PrivacyUseItem[];
  protection: {
    isActive: boolean;
    icon: string;
    title: string;
    body: string;
    badges: PrivacyBadge[];
  };
};

type ApiItem = { id?: string; title?: string; description?: string; is_active?: boolean };
type ApiBadge = { id?: string; icon?: string; label?: string; is_active?: boolean };
type ApiProtection = {
  is_active?: boolean;
  icon?: string;
  title?: string;
  body?: string;
  badges?: ApiBadge[];
};
type ApiUsage = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  intro?: string;
  items?: ApiItem[];
  protection?: ApiProtection;
};

function toUsage(body: ApiUsage, fromAdmin: boolean): PrivacyUsage {
  const protection = body.protection ?? {};
  return {
    isActive: fromAdmin ? body.is_active !== false : true,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    intro: body.intro ?? "",
    items: (body.items ?? []).map((item, index) => ({
      id: item.id ?? `use-${index + 1}`,
      title: item.title ?? "",
      description: item.description ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
    protection: {
      isActive: fromAdmin ? protection.is_active !== false : true,
      icon: protection.icon ?? "",
      title: protection.title ?? "",
      body: protection.body ?? "",
      badges: (protection.badges ?? []).map((badge, index) => ({
        id: badge.id ?? `badge-${index + 1}`,
        icon: badge.icon ?? "",
        label: badge.label ?? "",
        isActive: fromAdmin ? badge.is_active !== false : true,
      })),
    },
  };
}

function toBody(block: PrivacyUsage) {
  return {
    is_active: block.isActive,
    icon: block.icon,
    nav_label: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    items: block.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      is_active: item.isActive,
    })),
    protection: {
      is_active: block.protection.isActive,
      icon: block.protection.icon,
      title: block.protection.title,
      body: block.protection.body,
      badges: block.protection.badges.map((badge) => ({
        id: badge.id,
        icon: badge.icon,
        label: badge.label,
        is_active: badge.isActive,
      })),
    },
  };
}

export async function getPrivacyUsage(): Promise<PrivacyUsage> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/usage");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the use section."));
  }
  return toUsage((await response.json()) as ApiUsage, true);
}

export async function savePrivacyUsage(block: PrivacyUsage): Promise<PrivacyUsage> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/usage", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(block)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the use section."));
  }
  return toUsage((await response.json()) as ApiUsage, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicPrivacyUsage(): Promise<PrivacyUsage | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/privacy/usage`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const block = toUsage((await response.json()) as ApiUsage, false);
    if (!block.heading.trim()) return { ...block, isActive: false };
    const note = block.protection;
    const protectionVisible = Boolean(
      note.title.trim() || note.body.trim() || note.badges.length,
    );
    return {
      ...block,
      protection: { ...note, isActive: protectionVisible },
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
  if (response.status === 401) return "Sign in again to edit the privacy page.";
  return fallback;
}
