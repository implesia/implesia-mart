import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ShippingContents = {
  isActive: boolean;
  title: string;
  subtitle: string;
  navLabel: string;
};

type ApiContents = {
  is_active?: boolean;
  title?: string;
  subtitle?: string;
  nav_label?: string;
};

function toContents(body: ApiContents, active: boolean): ShippingContents {
  return {
    isActive: active,
    title: body.title ?? "",
    subtitle: body.subtitle ?? "",
    navLabel: body.nav_label ?? "",
  };
}

function toBody(contents: ShippingContents) {
  return {
    is_active: contents.isActive,
    title: contents.title,
    subtitle: contents.subtitle,
    nav_label: contents.navLabel,
  };
}

export function shippingContentsHasCopy(contents: ShippingContents) {
  return Boolean(contents.title.trim() || contents.subtitle.trim() || contents.navLabel.trim());
}

export async function getShippingContents(): Promise<ShippingContents> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/contents");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the contents."));
  }
  const body = (await response.json()) as ApiContents;
  return toContents(body, body.is_active !== false);
}

export async function saveShippingContents(contents: ShippingContents): Promise<ShippingContents> {
  const response = await authorizedFetch("/api/v1/admin/pages/shipping/contents", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(contents)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the contents."));
  }
  const body = (await response.json()) as ApiContents;
  return toContents(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicShippingContents(): Promise<ShippingContents | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/shipping/contents`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const contents = toContents((await response.json()) as ApiContents, true);
    if (!shippingContentsHasCopy(contents)) return { ...contents, isActive: false };
    return contents;
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
