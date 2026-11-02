import { adminCoverSrc, coverSrc } from "@/lib/blog-view";
import { youtubeEmbed, youtubeId, youtubeThumb } from "@/lib/mart-api/youtube";

export type HomeMediaType = "image" | "video" | "youtube";

export type HomeMediaPublic = {
  heading: string;
  subheading: string;
  mediaType: HomeMediaType;
  imageSrc: string;
  videoSrc: string;
  youtubeId: string;
  thumbnailSrc: string;
  mediaAlt: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export type HomeMediaAdmin = Omit<HomeMediaPublic, "youtubeId"> & {
  isActive: boolean;
  ctaEnabled: boolean;
  /** The YouTube link as typed in the editor; the API stores only the video id. */
  youtubeUrl: string;
  /** A stored file can no longer be shown (e.g. a legacy temporary link): upload it again. */
  mediaNeedsUpload: boolean;
};

export const HOME_MEDIA_LIMITS = {
  heading: 120,
  subheading: 240,
  mediaAlt: 200,
  description: 500,
  ctaLabel: 60,
  ctaHref: 255,
  youtubeUrl: 300,
} as const;

export function toMediaType(value: unknown): HomeMediaType {
  return value === "video" || value === "youtube" ? value : "image";
}

export function blankHomeMedia(): HomeMediaAdmin {
  return {
    isActive: false,
    heading: "",
    subheading: "",
    mediaType: "image",
    imageSrc: "",
    videoSrc: "",
    youtubeUrl: "",
    thumbnailSrc: "",
    mediaAlt: "",
    description: "",
    ctaEnabled: false,
    ctaLabel: "",
    ctaHref: "",
    mediaNeedsUpload: false,
  };
}

/** Button target: a site path ("/x", no "//" or "..") or an https link. Anything else is "". */
export function safeHttpsCtaHref(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (!value || value.length > HOME_MEDIA_LIMITS.ctaHref) return "";
  if (/[\u0000-\u001f\s\\]/.test(value)) return "";
  if (value.startsWith("/")) return value.startsWith("//") || value.includes("..") ? "" : value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname ? url.href : "";
  } catch {
    return "";
  }
}

function videoSrc(raw: string, preview: boolean): string {
  if (preview && raw.startsWith("blob:")) return raw;
  const src = coverSrc(raw);
  if (!src) return "";
  const path = src.split(/[?#]/)[0]!.toLowerCase();
  return path.endsWith(".mp4") || path.endsWith(".webm") ? src : "";
}

export type RenderableHomeMedia = {
  heading: string;
  subheading: string;
  description: string;
  alt: string;
  media:
    | { type: "image"; src: string }
    | { type: "video"; src: string; poster: string }
    | { type: "youtube"; id: string; embed: string; thumb: string };
  cta: { href: string; label: string; external: boolean } | null;
};

/**
 * What the storefront draws, or null when the section must stay hidden (nothing published, no
 * heading, or no usable media for the chosen type). `preview` (the admin editor) also accepts
 * files chosen in the browser but not uploaded yet (blob: links).
 */
export function renderableHomeMedia(
  section: HomeMediaPublic | null | undefined,
  { preview = false }: { preview?: boolean } = {},
): RenderableHomeMedia | null {
  if (!section) return null;
  const src = preview ? adminCoverSrc : coverSrc;
  const heading = section.heading.trim();
  if (!heading) return null;
  const alt = section.mediaAlt.trim();
  let media: RenderableHomeMedia["media"];
  if (section.mediaType === "image") {
    const image = src(section.imageSrc);
    if (!image || !alt) return null;
    media = { type: "image", src: image };
  } else if (section.mediaType === "video") {
    const video = videoSrc(section.videoSrc, preview);
    if (!video) return null;
    media = { type: "video", src: video, poster: src(section.thumbnailSrc) };
  } else {
    const id = youtubeId(section.youtubeId);
    if (!id) return null;
    media = {
      type: "youtube",
      id,
      embed: `${youtubeEmbed(id)}&autoplay=1`,
      thumb: src(section.thumbnailSrc) || youtubeThumb(id),
    };
  }
  const href = safeHttpsCtaHref(section.ctaHref);
  const label = section.ctaLabel.trim();
  const cta = href && label ? { href, label, external: href.startsWith("https://") } : null;
  return {
    heading,
    subheading: section.subheading.trim(),
    description: section.description.trim(),
    alt: alt || heading,
    media,
    cta,
  };
}

/** Message for the first problem that would stop the API saving this section, else "". */
export function homeMediaDraftError(draft: HomeMediaAdmin): string {
  const link = draft.youtubeUrl.trim();
  if (draft.mediaType === "youtube" && link && !youtubeId(link)) {
    return "Enter a valid YouTube link (youtube.com/watch, youtu.be or shorts).";
  }
  if (draft.ctaEnabled) {
    if (!draft.ctaLabel.trim() || !draft.ctaHref.trim()) {
      return "Add both the button text and the button link, or turn the button off.";
    }
    if (!safeHttpsCtaHref(draft.ctaHref)) return "The button link must start with / or https://.";
  }
  if (!draft.isActive) return "";
  if (!draft.heading.trim()) return "Add a heading before turning the section on.";
  if (draft.mediaType === "image") {
    if (!draft.imageSrc.trim()) return "Add an image before turning the section on.";
    if (!draft.mediaAlt.trim()) return "Describe the image (alt text) before turning the section on.";
  }
  if (draft.mediaType === "video" && !draft.videoSrc.trim()) {
    return "Upload a video before turning the section on.";
  }
  if (draft.mediaType === "youtube" && !link) return "Add a YouTube link before turning the section on.";
  return "";
}

/** The draft as the storefront would see it (for the editor preview). */
export function homeMediaPreview(draft: HomeMediaAdmin): HomeMediaPublic {
  return {
    heading: draft.heading,
    subheading: draft.subheading,
    mediaType: draft.mediaType,
    imageSrc: draft.imageSrc,
    videoSrc: draft.videoSrc,
    youtubeId: youtubeId(draft.youtubeUrl),
    thumbnailSrc: draft.thumbnailSrc,
    mediaAlt: draft.mediaAlt,
    description: draft.description,
    ctaLabel: draft.ctaEnabled ? draft.ctaLabel : "",
    ctaHref: draft.ctaEnabled ? draft.ctaHref : "",
  };
}
