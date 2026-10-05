import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ReturnRule = {
  id: string;
  text: string;
  isActive: boolean;
};

export type ReturnNote = {
  id: string;
  icon: string;
  title: string;
  body: string;
  isActive: boolean;
};

export type ShippingReturns = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  eligibilityTitle: string;
  eligibilityBody: string;
  rules: ReturnRule[];
  notes: ReturnNote[];
};

type ApiRule = { id?: string; text?: string; is_active?: boolean };
type ApiNote = {
  id?: string;
  icon?: string;
  title?: string;
  body?: string;
  is_active?: boolean;
};
type ApiReturns = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  eligibility_title?: string;
  eligibility_body?: string;
  rules?: ApiRule[];
  notes?: ApiNote[];
};

function toReturns(body: ApiReturns, fromAdmin: boolean): ShippingReturns {
  const active = fromAdmin ? body.is_active !== false : true;
  return {
    isActive: active,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    eligibilityTitle: body.eligibility_title ?? "",
    eligibilityBody: body.eligibility_body ?? "",
    rules: (body.rules ?? []).map((item, index) => ({
      id: item.id ?? `rule-${index + 1}`,
      text: item.text ?? "",
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

function toBody(returns: ShippingReturns) {
  return {
    is_active: returns.isActive,
    icon: returns.icon,
    nav_label: returns.navLabel,
    heading: returns.heading,
    eligibility_title: returns.eligibilityTitle,
    eligibility_body: returns.eligibilityBody,
    rules: returns.rules.map((item) => ({
      id: item.id,
      text: item.text,
      is_active: item.isActive,
    })),
    notes: returns.notes.map((item) => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      body: item.body,
      is_active: item.isActive,
    })),
  };
}

export async function getShippingReturns(): Promise<ShippingReturns> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/returns");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the returns section."));
  }
  return toReturns((await response.json()) as ApiReturns, true);
}

export async function saveShippingReturns(returns: ShippingReturns): Promise<ShippingReturns> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/returns", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(returns)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the returns section."));
  }
  return toReturns((await response.json()) as ApiReturns, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicShippingReturns(): Promise<ShippingReturns | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/shipping/returns`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const returns = toReturns((await response.json()) as ApiReturns, false);
    if (!returns.heading.trim()) return { ...returns, isActive: false };
    return returns;
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
