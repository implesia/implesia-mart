import { API_BASE_URL } from "@/lib/mart-api/media-url";
import { MartApiError, authorizedFetch, fileFromSrc } from "@/lib/mart-api/products";
import { clampFocal, type PromoAdmin, type PromoPublic, type PromoTone } from "@/lib/promo-view";

type ApiPromo = {
  is_active?: boolean;
  eyebrow?: string;
  heading?: string;
  body?: string;
  cta_label?: string;
  cta_href?: string;
  image_src?: string;
  image_alt?: string;
  focal_x?: number;
  focal_y?: number;
  tone?: string;
  image_needs_upload?: boolean;
};

const ADMIN_URL = "/api/v1/admin/home/promo";

function toTone(value: string | undefined): PromoTone {
  return value === "light" ? "light" : "dark";
}

function toPublic(body: ApiPromo): PromoPublic {
  return {
    eyebrow: body.eyebrow ?? "",
    heading: body.heading ?? "",
    body: body.body ?? "",
    ctaLabel: body.cta_label ?? "",
    ctaHref: body.cta_href ?? "",
    imageSrc: body.image_src ?? "",
    imageAlt: body.image_alt ?? "",
    focalX: clampFocal(body.focal_x ?? 50),
    focalY: clampFocal(body.focal_y ?? 50),
    tone: toTone(body.tone),
  };
}

function toAdmin(body: ApiPromo): PromoAdmin {
  return {
    ...toPublic(body),
    isActive: body.is_active === true,
    imageNeedsUpload: body.image_needs_upload === true,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the banner.";
  return fallback;
}

/** The live banner, or null when none is published or the API cannot be reached. */
export async function listPublicPromo(): Promise<PromoPublic | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/home/promo`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiPromo | null;
    return body ? toPublic(body) : null;
  } catch {
    return null;
  }
}

export async function getAdminPromo(): Promise<PromoAdmin> {
  const response = await authorizedFetch(ADMIN_URL);
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the banner."));
  }
  return toAdmin((await response.json()) as ApiPromo);
}

/** Sends a chosen image (a blob: preview) to the media store; returns its `/media/promo/..` path. */
export async function uploadPromoImage(src: string): Promise<string> {
  const file = await fileFromSrc(src, "banner");
  const form = new FormData();
  form.append("image", file);
  const response = await authorizedFetch(`${ADMIN_URL}/image`, { method: "POST", body: form });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not upload the banner image."));
  }
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new MartApiError("Could not upload the banner image.");
  return body.url;
}

/** Saves the banner; a freshly chosen image (blob:) is uploaded first. */
export async function savePromo(draft: PromoAdmin): Promise<PromoAdmin> {
  const imageSrc = draft.imageSrc.startsWith("blob:")
    ? await uploadPromoImage(draft.imageSrc)
    : draft.imageSrc;
  const response = await authorizedFetch(ADMIN_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      is_active: draft.isActive,
      eyebrow: draft.eyebrow,
      heading: draft.heading,
      body: draft.body,
      cta_label: draft.ctaLabel,
      cta_href: draft.ctaHref,
      image_src: imageSrc,
      image_alt: draft.imageAlt,
      focal_x: clampFocal(draft.focalX),
      focal_y: clampFocal(draft.focalY),
      tone: draft.tone,
    }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the banner."));
  }
  return toAdmin((await response.json()) as ApiPromo);
}
