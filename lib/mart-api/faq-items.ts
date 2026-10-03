import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type FaqItem = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  isActive: boolean;
};

type ApiItem = {
  id?: string;
  category_id?: string | null;
  question?: string;
  answer?: string;
  is_active?: boolean;
};

type ApiItems = { items?: ApiItem[] };

function toItem(body: ApiItem, index: number, active: boolean): FaqItem {
  return {
    id: body.id ?? `question-${index + 1}`,
    categoryId: body.category_id ?? "",
    question: body.question ?? "",
    answer: body.answer ?? "",
    isActive: active,
  };
}

function toItems(body: ApiItems, fromAdmin: boolean): FaqItem[] {
  return (body.items ?? []).map((item, index) =>
    toItem(item, index, fromAdmin ? item.is_active !== false : true),
  );
}

function toBody(item: Pick<FaqItem, "categoryId" | "question" | "answer" | "isActive">) {
  return {
    category_id: item.categoryId,
    question: item.question,
    answer: item.answer,
    is_active: item.isActive,
  };
}

export async function getFaqItems(): Promise<FaqItem[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/items");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the questions."));
  }
  return toItems((await response.json()) as ApiItems, true);
}

export async function createFaqItem(
  item: Pick<FaqItem, "categoryId" | "question" | "answer" | "isActive">,
): Promise<FaqItem> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(item)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not add the question."));
  }
  const body = (await response.json()) as ApiItem;
  return toItem(body, 0, body.is_active !== false);
}

export async function updateFaqItem(item: FaqItem): Promise<FaqItem> {
  const response = await authorizedFetch(`/api/v1/admin/pages/faqs/items/${item.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(item)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the question."));
  }
  const body = (await response.json()) as ApiItem;
  return toItem(body, 0, body.is_active !== false);
}

export async function deleteFaqItem(id: string): Promise<void> {
  const response = await authorizedFetch(`/api/v1/admin/pages/faqs/items/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the question."));
  }
}

export async function reorderFaqItems(ids: string[]): Promise<FaqItem[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/items/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the questions."));
  }
  return toItems((await response.json()) as ApiItems, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicFaqItems(): Promise<FaqItem[]> {
  try {
    const response = await fetch(`${API}/api/v1/pages/faqs/items`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return [];
    return toItems((await response.json()) as ApiItems, false);
  } catch {
    return [];
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the FAQ page.";
  return fallback;
}
