import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type FaqCallout = {
  isActive: boolean;
  eyebrow: string;
  body: string;
};

type ApiCallout = {
  is_active?: boolean;
  eyebrow?: string;
  body?: string;
};

function toCallout(body: ApiCallout, active: boolean): FaqCallout {
  return {
    isActive: active,
    eyebrow: body.eyebrow ?? "",
    body: body.body ?? "",
  };
}

function toBody(callout: FaqCallout) {
  return {
    is_active: callout.isActive,
    eyebrow: callout.eyebrow,
    body: callout.body,
  };
}

export async function getFaqCallout(): Promise<FaqCallout> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/callout");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the callout."));
  }
  const body = (await response.json()) as ApiCallout;
  return toCallout(body, body.is_active !== false);
}

export async function saveFaqCallout(callout: FaqCallout): Promise<FaqCallout> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/callout", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(callout)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the callout."));
  }
  const body = (await response.json()) as ApiCallout;
  return toCallout(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicFaqCallout(): Promise<FaqCallout | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/faqs/callout`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const callout = toCallout((await response.json()) as ApiCallout, true);
    if (!callout.body.trim()) return { ...callout, isActive: false };
    return callout;
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
  if (response.status === 401) return "Sign in again to edit the FAQ page.";
  return fallback;
}
