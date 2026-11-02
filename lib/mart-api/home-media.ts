import {
  toMediaType,
  type HomeMediaAdmin,
  type HomeMediaPublic,
} from "@/lib/home-media-view";
import { API_BASE_URL } from "@/lib/mart-api/media-url";
import { MartApiError, authorizedFetch, fileFromSrc } from "@/lib/mart-api/products";

type ApiHomeMedia = {
  is_active?: boolean;
  heading?: string;
  subheading?: string;
  media_type?: string;
  image_src?: string;
  video_src?: string;
  youtube_id?: string;
  youtube_url?: string;
  thumbnail_src?: string;
  media_alt?: string;
  description?: string;
  cta_enabled?: boolean;
  cta_label?: string;
  cta_href?: string;
  media_needs_upload?: boolean;
};

const ADMIN_URL = "/api/v1/admin/home/media";

function toPublic(body: ApiHomeMedia): HomeMediaPublic {
  return {
    heading: body.heading ?? "",
    subheading: body.subheading ?? "",
    mediaType: toMediaType(body.media_type),
    imageSrc: body.image_src ?? "",
    videoSrc: body.video_src ?? "",
    youtubeId: body.youtube_id ?? "",
    thumbnailSrc: body.thumbnail_src ?? "",
    mediaAlt: body.media_alt ?? "",
    description: body.description ?? "",
    ctaLabel: body.cta_label ?? "",
    ctaHref: body.cta_href ?? "",
  };
}

function toAdmin(body: ApiHomeMedia): HomeMediaAdmin {
  const { youtubeId: _id, ...rest } = toPublic(body);
  void _id;
  return {
    ...rest,
    isActive: body.is_active === true,
    ctaEnabled: body.cta_enabled === true,
    youtubeUrl: body.youtube_url ?? "",
    mediaNeedsUpload: body.media_needs_upload === true,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit this section.";
  return fallback;
}

/** The live media section, or null when none is published or the API cannot be reached. */
export async function listPublicHomeMedia(): Promise<HomeMediaPublic | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/home/media`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiHomeMedia | null;
    return body ? toPublic(body) : null;
  } catch {
    return null;
  }
}

export async function getAdminHomeMedia(): Promise<HomeMediaAdmin> {
  const response = await authorizedFetch(ADMIN_URL);
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the media section."));
  }
  return toAdmin((await response.json()) as ApiHomeMedia);
}

/** Sends a chosen file (a blob: preview) to the media store; returns its `/media/home-media/..` path. */
async function upload(src: string, kind: "image" | "video"): Promise<string> {
  const file = await fileFromSrc(src, kind === "video" ? "video" : "image");
  const form = new FormData();
  form.append(kind, file);
  const response = await authorizedFetch(`${ADMIN_URL}/${kind}`, { method: "POST", body: form });
  const fallback = kind === "video" ? "Could not upload the video." : "Could not upload the image.";
  if (!response.ok) throw new MartApiError(await readError(response, fallback));
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new MartApiError(fallback);
  return body.url;
}

function uploaded(src: string, kind: "image" | "video") {
  return src.startsWith("blob:") ? upload(src, kind) : Promise.resolve(src);
}

/** Saves the section; freshly chosen files (blob:) for the chosen media type are uploaded first. */
export async function saveHomeMedia(draft: HomeMediaAdmin): Promise<HomeMediaAdmin> {
  const type = draft.mediaType;
  const imageSrc = type === "image" ? await uploaded(draft.imageSrc, "image") : "";
  const videoSrc = type === "video" ? await uploaded(draft.videoSrc, "video") : "";
  const thumbnailSrc = type === "image" ? "" : await uploaded(draft.thumbnailSrc, "image");
  const response = await authorizedFetch(ADMIN_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      is_active: draft.isActive,
      heading: draft.heading,
      subheading: draft.subheading,
      media_type: type,
      image_src: imageSrc,
      video_src: videoSrc,
      youtube_url: type === "youtube" ? draft.youtubeUrl.trim() : "",
      thumbnail_src: thumbnailSrc,
      media_alt: draft.mediaAlt,
      description: draft.description,
      cta_enabled: draft.ctaEnabled,
      cta_label: draft.ctaLabel,
      cta_href: draft.ctaHref.trim(),
    }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the media section."));
  }
  return toAdmin((await response.json()) as ApiHomeMedia);
}
