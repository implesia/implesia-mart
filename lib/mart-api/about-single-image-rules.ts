/**
 * Pure rules for the single About photo (backend 0071). Kept free of network
 * helpers so they can be unit tested. Messages match the API's 422 detail.
 */
export type SingleImage = { id: string; src: string; alt: string };

export const MISSING_PHOTO = "Add a photo for this section.";
export const MISSING_ALT = "Add a short description of the photo (alt text).";

/** Picks `image`, falling back to the legacy `images[0]` from an API not yet on 0071. */
export function pickSingleImage(body: { image?: SingleImage | null; images?: SingleImage[] }) {
  const raw = body.image ?? body.images?.[0] ?? null;
  return raw?.src ? raw : null;
}

export function singleImageErrors(image: { src: string; alt: string } | null) {
  return {
    photo: image?.src.trim() ? "" : MISSING_PHOTO,
    alt: image?.alt.trim() ? "" : MISSING_ALT,
  };
}
