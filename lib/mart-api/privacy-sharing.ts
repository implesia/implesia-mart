import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type PrivacyChip = {
  id: string;
  label: string;
  isActive: boolean;
};

export type PrivacySharing = {
  isActive: boolean;
  icon: string;
  navLabel: string;
  heading: string;
  body: string;
  chips: PrivacyChip[];
};

type ApiChip = { id?: string; label?: string; is_active?: boolean };
type ApiSharing = {
  is_active?: boolean;
  icon?: string;
  nav_label?: string;
  heading?: string;
  body?: string;
  chips?: ApiChip[];
};

function toSharing(body: ApiSharing, fromAdmin: boolean): PrivacySharing {
  return {
    isActive: fromAdmin ? body.is_active !== false : true,
    icon: body.icon ?? "",
    navLabel: body.nav_label ?? "",
    heading: body.heading ?? "",
    body: body.body ?? "",
    chips: (body.chips ?? []).map((item, index) => ({
      id: item.id ?? `chip-${index + 1}`,
      label: item.label ?? "",
      isActive: fromAdmin ? item.is_active !== false : true,
    })),
  };
}

function toBody(block: PrivacySharing) {
  return {
    is_active: block.isActive,
    icon: block.icon,
    nav_label: block.navLabel,
    heading: block.heading,
    body: block.body,
    chips: block.chips.map((item) => ({
      id: item.id,
      label: item.label,
      is_active: item.isActive,
    })),
  };
}

export async function getPrivacySharing(): Promise<PrivacySharing> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/sharing");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the sharing section."));
  }
  return toSharing((await response.json()) as ApiSharing, true);
}

export async function savePrivacySharing(block: PrivacySharing): Promise<PrivacySharing> {
  const response = await authorizedFetch("/api/v1/admin/pages/privacy/sharing", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(block)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the sharing section."));
  }
  return toSharing((await response.json()) as ApiSharing, true);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicPrivacySharing(): Promise<PrivacySharing | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/privacy/sharing`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const block = toSharing((await response.json()) as ApiSharing, false);
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
