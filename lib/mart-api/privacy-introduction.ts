import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type PrivacyParagraph = {
  id: string;
  text: string;
  isActive: boolean;
};

export type PrivacyIntroduction = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  paragraphs: PrivacyParagraph[];
};

type ApiParagraph = { id?: string; text?: string; is_active?: boolean };
type ApiIntroduction = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  paragraphs?: ApiParagraph[];
};

function toIntroduction(body: ApiIntroduction, fromAdmin: boolean): PrivacyIntroduction {
  return {
    isActive: fromAdmin ? body.is_active !== false : true,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    paragraphs: (body.paragraphs ?? []).map((item, index) => ({
      id: item.id ?? `para-${index + 1}`,
      text: item.text ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
  };
}

function toBody(block: PrivacyIntroduction) {
  return {
    is_active: block.isActive,
    icon: block.icon,
    nav_label: block.navLabel,
    heading: block.heading,
    paragraphs: block.paragraphs.map((item) => ({
      id: item.id,
      text: item.text,
      is_active: item.isActive,
    })),
  };
}

export async function getPrivacyIntroduction(): Promise<PrivacyIntroduction> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/introduction");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the introduction."));
  }
  return toIntroduction((await response.json()) as ApiIntroduction, true);
}

export async function savePrivacyIntroduction(
  block: PrivacyIntroduction,
): Promise<PrivacyIntroduction> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/introduction", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(block)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the introduction."));
  }
  return toIntroduction((await response.json()) as ApiIntroduction, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicPrivacyIntroduction(): Promise<PrivacyIntroduction | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/privacy/introduction`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const block = toIntroduction((await response.json()) as ApiIntroduction, false);
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
  if (response.status === 401) return "Sign in again to edit the privacy page.";
  return fallback;
}
