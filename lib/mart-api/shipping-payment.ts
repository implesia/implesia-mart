import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type PaymentCard = {
  id: string;
  icon: string;
  badge: string;
  title: string;
  body: string;
  footnote: string;
  isActive: boolean;
};

export type ShippingPayment = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  cards: PaymentCard[];
};

type ApiCard = {
  id?: string;
  icon?: string;
  badge?: string;
  title?: string;
  body?: string;
  footnote?: string;
  is_active?: boolean;
};

type ApiPayment = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  intro?: string;
  cards?: ApiCard[];
};

function toPayment(body: ApiPayment, fromAdmin: boolean): ShippingPayment {
  const active = fromAdmin ? body.is_active !== false : true;
  return {
    isActive: active,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    intro: body.intro ?? "",
    cards: (body.cards ?? []).map((item, index) => ({
      id: item.id ?? `card-${index + 1}`,
      icon: item.icon ?? "",
      badge: item.badge ?? "",
      title: item.title ?? "",
      body: item.body ?? "",
      footnote: item.footnote ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
  };
}

function toBody(payment: ShippingPayment) {
  return {
    is_active: payment.isActive,
    icon: payment.icon,
    nav_label: payment.navLabel,
    heading: payment.heading,
    intro: payment.intro,
    cards: payment.cards.map((item) => ({
      id: item.id,
      icon: item.icon,
      badge: item.badge,
      title: item.title,
      body: item.body,
      footnote: item.footnote,
      is_active: item.isActive,
    })),
  };
}

export async function getShippingPayment(): Promise<ShippingPayment> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/payment");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the payment section."));
  }
  return toPayment((await response.json()) as ApiPayment, true);
}

export async function saveShippingPayment(payment: ShippingPayment): Promise<ShippingPayment> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/payment", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(payment)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the payment section."));
  }
  return toPayment((await response.json()) as ApiPayment, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicShippingPayment(): Promise<ShippingPayment | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/shipping/payment`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const payment = toPayment((await response.json()) as ApiPayment, false);
    if (!payment.heading.trim()) return { ...payment, isActive: false };
    return payment;
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
