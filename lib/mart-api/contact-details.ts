import { cache } from "react";

import { FALLBACK_CONTACT_DETAILS } from "@/lib/mart-api/contact-fallback";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export { FALLBACK_CONTACT_DETAILS };

export type ContactChannel = {
  id: string;
  icon: string;
  title: string;
  value: string;
  href: string;
  isActive: boolean;
};

export type ContactSocialPlatform = "facebook" | "linkedin";

export type ContactSocial = {
  platform: ContactSocialPlatform;
  label: string;
  href: string;
  isActive: boolean;
};

export type ContactDetails = {
  isActive: boolean;
  title: string;
  subtitle: string;
  badge: string;
  channels: ContactChannel[];
  social: ContactSocial[];
};

type ApiChannel = {
  id?: string;
  icon?: string;
  title?: string;
  value?: string;
  href?: string;
  is_active?: boolean;
};
type ApiSocial = {
  platform?: string;
  label?: string;
  href?: string;
  is_active?: boolean;
};
type ApiDetails = {
  is_active?: boolean;
  title: string;
  subtitle?: string;
  badge?: string;
  channels?: ApiChannel[];
  social?: ApiSocial[];
};

const PLATFORMS: ContactSocialPlatform[] = ["facebook", "linkedin"];

function channel(body: ApiChannel, index: number): ContactChannel {
  return {
    id: body.id ?? `channel-${index + 1}`,
    icon: body.icon || "call",
    title: body.title ?? "",
    value: body.value ?? "",
    href: body.href ?? "",
    isActive: body.is_active !== false,
  };
}

function socialPair(items: ApiSocial[] | undefined): ContactSocial[] {
  return PLATFORMS.map((platform) => {
    const found = items?.find((item) => item.platform === platform);
    return {
      platform,
      label: found?.label ?? "",
      href: found?.href ?? "",
      isActive: found?.is_active !== false,
    };
  });
}

function toDetails(body: ApiDetails, active: boolean): ContactDetails {
  return {
    isActive: active,
    title: body.title,
    subtitle: body.subtitle ?? "",
    badge: body.badge ?? "",
    channels: (body.channels ?? []).map(channel),
    social: socialPair(body.social),
  };
}

function toBody(details: ContactDetails) {
  return {
    is_active: details.isActive,
    title: details.title,
    subtitle: details.subtitle,
    badge: details.badge,
    channels: details.channels.map((item) => ({
      icon: item.icon,
      title: item.title,
      value: item.value,
      href: item.href,
      is_active: item.isActive,
    })),
    social: details.social.map((item) => ({
      platform: item.platform,
      label: item.label,
      href: item.href,
      is_active: item.isActive,
    })),
  };
}

export function contactChannel(details: ContactDetails | null, icon: string) {
  if (!details?.isActive) return undefined;
  return details.channels.find((item) => item.icon === icon && item.isActive);
}

export async function getContactDetails(): Promise<ContactDetails> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/details");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the contacts."));
  }
  const body = (await response.json()) as ApiDetails;
  return toDetails(body, body.is_active !== false);
}

export async function saveContactDetails(details: ContactDetails): Promise<ContactDetails> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/details", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(details)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the contacts."));
  }
  const body = (await response.json()) as ApiDetails;
  return toDetails(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export const listPublicContactDetails = cache(async (): Promise<ContactDetails> => {
  try {
    const response = await fetch(`${API}/api/v1/pages/contact/details`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return FALLBACK_CONTACT_DETAILS;
    const body = (await response.json()) as ApiDetails;
    if (!body.title.trim()) return toDetails({ ...body, title: "" }, false);
    return toDetails(body, true);
  } catch {
    return FALLBACK_CONTACT_DETAILS;
  }
});

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
