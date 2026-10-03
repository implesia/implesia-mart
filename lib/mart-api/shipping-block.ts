import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ShippingCard = {
  id: string;
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  variant: "default" | "primary";
  isActive: boolean;
};

export type ShippingTimeline = {
  id: string;
  label: string;
  value: string;
  isActive: boolean;
};

export type ShippingNote = {
  id: string;
  icon: string;
  title: string;
  body: string;
  isActive: boolean;
};

export type ShippingBlock = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  cards: ShippingCard[];
  timelinesTitle: string;
  timelines: ShippingTimeline[];
  notes: ShippingNote[];
};

type ApiCard = {
  id?: string;
  icon?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  variant?: string;
  is_active?: boolean;
};

type ApiTime = {
  id?: string;
  label?: string;
  value?: string;
  is_active?: boolean;
};

type ApiNote = {
  id?: string;
  icon?: string;
  title?: string;
  body?: string;
  is_active?: boolean;
};

type ApiBlock = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  intro?: string;
  timelines_title?: string;
  cards?: ApiCard[];
  timelines?: ApiTime[];
  notes?: ApiNote[];
};

function toBlock(body: ApiBlock, fromAdmin: boolean): ShippingBlock {
  const active = fromAdmin ? body.is_active !== false : true;
  return {
    isActive: active,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    intro: body.intro ?? "",
    timelinesTitle: body.timelines_title ?? "",
    cards: (body.cards ?? []).map((item, index) => ({
      id: item.id ?? `card-${index + 1}`,
      icon: item.icon ?? "",
      eyebrow: item.eyebrow ?? "",
      title: item.title ?? "",
      body: item.body ?? "",
      variant: item.variant === "primary" ? "primary" : "default",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
    timelines: (body.timelines ?? []).map((item, index) => ({
      id: item.id ?? `time-${index + 1}`,
      label: item.label ?? "",
      value: item.value ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
    notes: (body.notes ?? []).map((item, index) => ({
      id: item.id ?? `note-${index + 1}`,
      icon: item.icon ?? "",
      title: item.title ?? "",
      body: item.body ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
  };
}

function toBody(block: ShippingBlock) {
  return {
    is_active: block.isActive,
    icon: block.icon,
    nav_label: block.navLabel,
    heading: block.heading,
    intro: block.intro,
    timelines_title: block.timelinesTitle,
    cards: block.cards.map((item) => ({
      id: item.id,
      icon: item.icon,
      eyebrow: item.eyebrow,
      title: item.title,
      body: item.body,
      variant: item.variant,
      is_active: item.isActive,
    })),
    timelines: block.timelines.map((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      is_active: item.isActive,
    })),
    notes: block.notes.map((item) => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      body: item.body,
      is_active: item.isActive,
    })),
  };
}

export async function getShippingBlock(): Promise<ShippingBlock> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/shipping");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the shipping section."));
  }
  return toBlock((await response.json()) as ApiBlock, true);
}

export async function saveShippingBlock(block: ShippingBlock): Promise<ShippingBlock> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/shipping", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(block)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the shipping section."));
  }
  return toBlock((await response.json()) as ApiBlock, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicShippingBlock(): Promise<ShippingBlock | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/shipping/shipping`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const block = toBlock((await response.json()) as ApiBlock, false);
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
  if (response.status === 401) return "Sign in again to edit the shipping page.";
  return fallback;
}
