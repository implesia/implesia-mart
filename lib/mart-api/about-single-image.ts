import { fileFromSrc, isLocalImage, mediaUrl, sitePath } from "@/lib/mart-api/products";

import { pickSingleImage, type SingleImage } from "./about-single-image-rules";

export {
  MISSING_ALT,
  MISSING_PHOTO,
  singleImageErrors,
  type SingleImage,
} from "./about-single-image-rules";

export function readSingleImage(body: { image?: SingleImage | null; images?: SingleImage[] }) {
  const raw = pickSingleImage(body);
  return raw ? { id: raw.id, src: mediaUrl(raw.src), alt: raw.alt } : null;
}

/** Adds the photo to a multipart save: a local pick is uploaded as `image`, else `src` is kept. */
export async function appendSingleImage(
  body: FormData,
  payload: Record<string, unknown>,
  image: { src: string; alt: string } | null,
  fileName: string,
) {
  const src = image?.src.trim() ?? "";
  const local = Boolean(src) && isLocalImage(src);
  payload.image = image ? { alt: image.alt.trim(), src: local || !src ? "" : sitePath(src) } : null;
  body.set("payload", JSON.stringify(payload));
  if (local) body.set("image", await fileFromSrc(src, fileName));
}
