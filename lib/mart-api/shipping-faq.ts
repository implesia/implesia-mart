import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ShippingFaqItem = {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
};

export type ShippingFaq = {
  isActive: boolean;
  title: string;
  items: ShippingFaqItem[];
  moreBefore: string;
  moreLinkLabel: string;
  moreHref: string;
  moreAfter: string;
};

type ApiItem = { id?: string; question?: string; answer?: string; is_active?: boolean };
type ApiFaq = {
  is_active?: boolean;
  title?: string;
  items?: ApiItem[];
  more_before?: string;
  more_link_label?: string;
  more_href?: string;
  more_after?: string;
};

function toFaq(body: ApiFaq, fromAdmin: boolean): ShippingFaq {
  return {
    isActive: fromAdmin ? body.is_active !== false : true,
    title: body.title ?? "",
    moreBefore: body.more_before ?? "",
    moreLinkLabel: body.more_link_label ?? "",
    moreHref: body.more_href ?? "",
    moreAfter: body.more_after ?? "",
    items: (body.items ?? []).map((item, index) => ({
      id: item.id ?? `faq-${index + 1}`,
      question: item.question ?? "",
      answer: item.answer ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
  };
}

function toBody(faq: ShippingFaq) {
  return {
    is_active: faq.isActive,
    title: faq.title,
    more_before: faq.moreBefore,
    more_link_label: faq.moreLinkLabel,
    more_href: faq.moreHref,
    more_after: faq.moreAfter,
    items: faq.items.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      is_active: item.isActive,
    })),
  };
}

export async function getShippingFaq(): Promise<ShippingFaq> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/faq");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the FAQ."));
  }
  return toFaq((await response.json()) as ApiFaq, true);
}

export async function saveShippingFaq(faq: ShippingFaq): Promise<ShippingFaq> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/faq", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(faq)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the FAQ."));
  }
  return toFaq((await response.json()) as ApiFaq, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicShippingFaq(): Promise<ShippingFaq | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/shipping/faq`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const faq = toFaq((await response.json()) as ApiFaq, false);
    const hasQuestion = faq.items.some((item) => item.question.trim() && item.answer.trim());
    const hasMore = Boolean(faq.moreBefore.trim() || faq.moreLinkLabel.trim() || faq.moreAfter.trim());
    if (!hasQuestion && !hasMore) return { ...faq, isActive: false };
    return faq;
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
