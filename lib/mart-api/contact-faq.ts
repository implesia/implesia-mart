import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ContactFaqItem = {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
};

export type ContactFaq = {
  isActive: boolean;
  title: string;
  subtitle: string;
  items: ContactFaqItem[];
};

type ApiItem = {
  id?: string;
  question?: string;
  answer?: string;
  is_active?: boolean;
};
type ApiFaq = {
  is_active?: boolean;
  title: string;
  subtitle?: string;
  items?: ApiItem[];
};

function item(body: ApiItem, index: number): ContactFaqItem {
  return {
    id: body.id ?? `faq-${index + 1}`,
    question: body.question ?? "",
    answer: body.answer ?? "",
    isActive: body.is_active !== false,
  };
}

function toFaq(body: ApiFaq, active: boolean): ContactFaq {
  return {
    isActive: active,
    title: body.title,
    subtitle: body.subtitle ?? "",
    items: (body.items ?? []).map(item),
  };
}

function toBody(faq: ContactFaq) {
  return {
    is_active: faq.isActive,
    title: faq.title,
    subtitle: faq.subtitle,
    items: faq.items.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
      is_active: entry.isActive,
    })),
  };
}

export async function getContactFaq(): Promise<ContactFaq> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/faq");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the FAQ."));
  }
  const body = (await response.json()) as ApiFaq;
  return toFaq(body, body.is_active !== false);
}

export async function saveContactFaq(faq: ContactFaq): Promise<ContactFaq> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/faq", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(faq)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the FAQ."));
  }
  const body = (await response.json()) as ApiFaq;
  return toFaq(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicContactFaq(): Promise<ContactFaq | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/contact/faq`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiFaq;
    if (!body.title.trim()) return toFaq({ ...body, title: "" }, false);
    return toFaq(body, true);
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
  if (response.status === 401) return "Sign in again to edit the contact page.";
  return fallback;
}
