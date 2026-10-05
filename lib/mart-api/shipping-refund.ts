import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type RefundStep = {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
};

export type ShippingRefund = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  steps: RefundStep[];
  note: string;
};

type ApiStep = { id?: string; title?: string; body?: string; is_active?: boolean };
type ApiRefund = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  note?: string;
  steps?: ApiStep[];
};

function toRefund(body: ApiRefund, fromAdmin: boolean): ShippingRefund {
  const active = fromAdmin ? body.is_active !== false : true;
  return {
    isActive: active,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    note: body.note ?? "",
    steps: (body.steps ?? []).map((item, index) => ({
      id: item.id ?? `step-${index + 1}`,
      title: item.title ?? "",
      body: item.body ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
  };
}

function toBody(refund: ShippingRefund) {
  return {
    is_active: refund.isActive,
    icon: refund.icon,
    nav_label: refund.navLabel,
    heading: refund.heading,
    note: refund.note,
    steps: refund.steps.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      is_active: item.isActive,
    })),
  };
}

export async function getShippingRefund(): Promise<ShippingRefund> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/refund");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the refund section."));
  }
  return toRefund((await response.json()) as ApiRefund, true);
}

export async function saveShippingRefund(refund: ShippingRefund): Promise<ShippingRefund> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/refund", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(refund)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the refund section."));
  }
  return toRefund((await response.json()) as ApiRefund, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicShippingRefund(): Promise<ShippingRefund | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/shipping/refund`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const refund = toRefund((await response.json()) as ApiRefund, false);
    if (!refund.heading.trim()) return { ...refund, isActive: false };
    return refund;
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
