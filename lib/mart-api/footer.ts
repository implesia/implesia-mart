import { unstable_rethrow } from "next/navigation";

import {
  DEFAULT_FOOTER,
  type FooterAdmin,
  type FooterConfig,
  type FooterLink,
  type FooterSection,
  type FooterTrustPoint,
} from "@/lib/footer-view";
import { API_BASE_URL, mediaUrl } from "@/lib/mart-api/media-url";
import { MartApiError, authorizedFetch, fileFromSrc } from "@/lib/mart-api/products";

type ApiLink = { label?: string; href?: string; enabled?: boolean };
type ApiSection = { title?: string; enabled?: boolean; links?: ApiLink[] };
type ApiTrust = { icon?: string; label?: string; enabled?: boolean };
type ApiFooter = {
  brand_name?: string;
  description?: string;
  logo_src?: string;
  logo_alt?: string;
  address?: string;
  copyright_text?: string;
  show_contact?: boolean;
  show_social?: boolean;
  show_whatsapp_cta?: boolean;
  sections?: ApiSection[];
  trust_points?: ApiTrust[];
  legal_links?: ApiLink[];
  is_default?: boolean;
  logo_needs_upload?: boolean;
};

const ADMIN_URL = "/api/v1/admin/site/footer";

const toLink = (item: ApiLink): FooterLink => ({
  label: item.label ?? "",
  href: item.href ?? "",
  enabled: item.enabled !== false,
});

const toSection = (item: ApiSection): FooterSection => ({
  title: item.title ?? "",
  enabled: item.enabled !== false,
  links: (item.links ?? []).map(toLink),
});

const toTrust = (item: ApiTrust): FooterTrustPoint => ({
  icon: item.icon ?? "",
  label: item.label ?? "",
  enabled: item.enabled !== false,
});

function toConfig(body: ApiFooter): FooterConfig {
  return {
    brandName: body.brand_name ?? "",
    description: body.description ?? "",
    logoSrc: body.logo_src ?? "",
    logoAlt: body.logo_alt ?? "",
    address: body.address ?? "",
    copyrightText: body.copyright_text ?? "",
    showContact: body.show_contact !== false,
    showSocial: body.show_social !== false,
    showWhatsappCta: body.show_whatsapp_cta !== false,
    sections: (body.sections ?? []).map(toSection),
    trustPoints: (body.trust_points ?? []).map(toTrust),
    legalLinks: (body.legal_links ?? []).map(toLink),
  };
}

function toAdmin(body: ApiFooter): FooterAdmin {
  return {
    ...toConfig(body),
    isDefault: body.is_default === true,
    logoNeedsUpload: body.logo_needs_upload === true,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the footer.";
  if (response.status === 403) return "Your account cannot edit the footer.";
  return fallback;
}

/**
 * The live footer. Always fetched fresh from the API (`no-store`, no edge or KV cache), so a
 * saved edit shows on the next request. Falls back to the built-in footer if the API fails.
 */
export async function listPublicFooter(): Promise<FooterConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/site/footer`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn(`[footer] public footer request failed with ${response.status}; showing the built-in footer`);
      return DEFAULT_FOOTER;
    }
    const config = toConfig((await response.json()) as ApiFooter);
    return {
      ...config,
      logoSrc: mediaUrl(config.logoSrc),
      brandName: config.brandName || DEFAULT_FOOTER.brandName,
      copyrightText: config.copyrightText || DEFAULT_FOOTER.copyrightText,
    };
  } catch (error) {
    // Let Next see its own control-flow errors (dynamic-usage bail-out) instead of swallowing them.
    unstable_rethrow(error);
    console.warn("[footer] public footer unavailable; showing the built-in footer:", error instanceof Error ? error.message : error);
    return DEFAULT_FOOTER;
  }
}

export async function getAdminFooter(): Promise<FooterAdmin> {
  const response = await authorizedFetch(ADMIN_URL);
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the footer."));
  }
  return toAdmin((await response.json()) as ApiFooter);
}

/** Sends a chosen logo (a blob: preview) to the media store; returns its `/media/footer/..` path. */
export async function uploadFooterLogo(src: string): Promise<string> {
  const file = await fileFromSrc(src, "footer-logo");
  const form = new FormData();
  form.append("image", file);
  const response = await authorizedFetch(`${ADMIN_URL}/logo`, { method: "POST", body: form });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not upload the logo."));
  }
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new MartApiError("Could not upload the logo.");
  return body.url;
}

const outLink = (item: FooterLink) => ({
  label: item.label.trim(),
  href: item.href.trim(),
  enabled: item.enabled,
});

/** Saves the footer; a freshly chosen logo (blob:) is uploaded first. */
export async function saveFooter(draft: FooterConfig): Promise<FooterAdmin> {
  const logoSrc = draft.logoSrc.startsWith("blob:")
    ? await uploadFooterLogo(draft.logoSrc)
    : draft.logoSrc;
  const response = await authorizedFetch(ADMIN_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_name: draft.brandName.trim(),
      description: draft.description.trim(),
      logo_src: logoSrc,
      logo_alt: logoSrc ? draft.logoAlt.trim() : "",
      address: draft.address.trim(),
      copyright_text: draft.copyrightText.trim(),
      show_contact: draft.showContact,
      show_social: draft.showSocial,
      show_whatsapp_cta: draft.showWhatsappCta,
      sections: draft.sections.map((section) => ({
        title: section.title.trim(),
        enabled: section.enabled,
        links: section.links.map(outLink),
      })),
      trust_points: draft.trustPoints.map((point) => ({
        icon: point.icon.trim(),
        label: point.label.trim(),
        enabled: point.enabled,
      })),
      legal_links: draft.legalLinks.map(outLink),
    }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the footer."));
  }
  return toAdmin((await response.json()) as ApiFooter);
}

/** Removes the saved footer so the built-in defaults apply again. */
export async function resetFooter(): Promise<FooterAdmin> {
  const response = await authorizedFetch(ADMIN_URL, { method: "DELETE" });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not restore the default footer."));
  }
  return toAdmin((await response.json()) as ApiFooter);
}

