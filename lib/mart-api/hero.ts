import type { HeroAccent } from "@/lib/mart-mock/store";
import type { HeroSlide } from "@/app/(client)/_data/home/home";
import {
  MartApiError,
  authorizedFetch,
  fileFromSrc,
  isLocalImage,
  mediaUrl,
  sitePath,
} from "@/lib/mart-api/products";
import {
  DEFAULT_HERO_SETTINGS,
  mapHeroSettings,
  type ApiBannerSettings,
  type HeroCarouselSettings,
} from "@/lib/mart-api/hero-settings";

export { DEFAULT_HERO_SETTINGS, mapHeroSettings, type HeroCarouselSettings };

export type HeroSlideInput = {
  eyebrow: string;
  title: string;
  description: string;
  priceLabel: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  imageSrc: string;
  imageAlt: string;
  accent: HeroAccent;
  published: boolean;
};

export type AdminHeroSlide = HeroSlideInput & { id: string };

type ApiSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  price_label: string;
  primary_cta: { label: string; href: string };
  image_src: string;
  image_alt: string;
  accent: HeroAccent;
  is_published: boolean;
};

type ApiPage = { items: ApiSlide[]; page: number; pages: number };

const ACCENTS = new Set<HeroAccent>(["gold", "teal", "rose", "ink"]);

export function blankHeroSlide(): HeroSlideInput {
  return {
    eyebrow: "",
    title: "",
    description: "",
    priceLabel: "",
    primaryCtaLabel: "Order now",
    primaryCtaHref: "/products",
    imageSrc: "",
    imageAlt: "",
    accent: "teal",
    published: true,
  };
}

function toSlide(body: ApiSlide): AdminHeroSlide {
  return {
    id: body.id,
    eyebrow: body.eyebrow,
    title: body.title,
    description: body.description,
    priceLabel: body.price_label,
    primaryCtaLabel: body.primary_cta.label,
    primaryCtaHref: body.primary_cta.href,
    imageSrc: body.image_src,
    imageAlt: body.image_alt,
    accent: ACCENTS.has(body.accent) ? body.accent : "teal",
    published: body.is_published,
  };
}

function toBody(slide: HeroSlideInput) {
  return {
    eyebrow: slide.eyebrow,
    title: slide.title,
    description: slide.description,
    price_label: slide.priceLabel,
    primary_cta_label: slide.primaryCtaLabel,
    primary_cta_href: slide.primaryCtaHref,
    image_src: slide.imageSrc,
    image_alt: slide.imageAlt,
    accent: slide.accent,
    is_published: slide.published,
  };
}

export function heroImage(src: string) {
  return mediaUrl(src);
}

export async function listHeroSlides(): Promise<AdminHeroSlide[]> {
  const slides: AdminHeroSlide[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages && page <= 20) {
    const response = await authorizedFetch(
      `/api/v1/admin/home/banner/slides?page=${page}&page_size=100`,
    );
    if (!response.ok) {
      throw new MartApiError(await readError(response, "Could not load hero slides."));
    }
    const body = (await response.json()) as ApiPage;
    slides.push(...body.items.map(toSlide));
    pages = body.pages || 1;
    page += 1;
  }
  return slides;
}

export async function getHeroSlide(id: string): Promise<AdminHeroSlide | null> {
  const response = await authorizedFetch(`/api/v1/admin/home/banner/slides/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load this slide."));
  }
  return toSlide((await response.json()) as ApiSlide);
}

async function slideForm(slide: HeroSlideInput) {
  const local = isLocalImage(slide.imageSrc);
  const body = new FormData();
  body.set(
    "payload",
    JSON.stringify({ ...toBody(slide), image_src: local ? "" : sitePath(slide.imageSrc) }),
  );
  if (local) body.set("image", await fileFromSrc(slide.imageSrc, "slide"));
  return body;
}

export async function createHeroSlide(slide: HeroSlideInput): Promise<AdminHeroSlide> {
  const response = await authorizedFetch("/api/v1/admin/home/banner/slides", {
    method: "POST",
    body: await slideForm(slide),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not create the slide."));
  }
  return toSlide((await response.json()) as ApiSlide);
}

export async function updateHeroSlide(id: string, slide: HeroSlideInput): Promise<AdminHeroSlide> {
  const response = await authorizedFetch(`/api/v1/admin/home/banner/slides/${id}`, {
    method: "PATCH",
    body: await slideForm(slide),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the slide."));
  }
  return toSlide((await response.json()) as ApiSlide);
}

export async function deleteHeroSlide(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/home/banner/slides/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not delete the slide."));
  }
}

export async function moveHeroSlide(id: string, direction: "earlier" | "later") {
  const response = await authorizedFetch(`/api/v1/admin/home/banner/slides/${id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the slide."));
  }
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

/** Same request as listPublicHeroSlides (deduplicated by Next), read for the settings. */
export async function getPublicHeroSettings(): Promise<HeroCarouselSettings> {
  try {
    const response = await fetch(`${API}/api/v1/home/banner`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return DEFAULT_HERO_SETTINGS;
    return mapHeroSettings((await response.json()) as ApiBannerSettings);
  } catch {
    return DEFAULT_HERO_SETTINGS;
  }
}

export async function listPublicHeroSlides(): Promise<HeroSlide[] | null> {
  try {
    const response = await fetch(`${API}/api/v1/home/banner`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { slides?: ApiSlide[] };
    return (body.slides ?? [])
      .filter((slide) => slide.image_src)
      .map((slide) => ({
        id: slide.id,
        eyebrow: slide.eyebrow,
        title: slide.title,
        description: slide.description,
        priceLabel: slide.price_label,
        primaryCta: slide.primary_cta,
        secondaryCta: { label: "", href: "/products" },
        imageSrc: heroImage(slide.image_src),
        imageAlt: slide.image_alt,
        accent: ACCENTS.has(slide.accent) ? slide.accent : "teal",
      }));
  } catch {
    return null;
  }
}

/** Banner settings exactly as stored, for the admin editor (no storefront fallbacks). */
export type BannerSettingsInput = {
  brandName: string;
  trustLine: string;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  slideLabel: string;
  autoplayDelayMs: number;
  transitionSpeedMs: number;
  pauseOnHover: boolean;
  loop: boolean;
  keyboardEnabled: boolean;
  disableOnInteraction: boolean;
  crossFade: boolean;
};

type ApiBannerRead = Required<ApiBannerSettings> & { slide_label: string };

function toBannerSettings(body: ApiBannerRead): BannerSettingsInput {
  return {
    brandName: body.brand_name,
    trustLine: body.trust_line,
    ariaLabel: body.aria_label,
    previousLabel: body.previous_label,
    nextLabel: body.next_label,
    slideLabel: body.slide_label,
    autoplayDelayMs: body.autoplay_delay_ms,
    transitionSpeedMs: body.transition_speed_ms,
    pauseOnHover: body.pause_on_hover,
    loop: body.loop,
    keyboardEnabled: body.keyboard_enabled,
    disableOnInteraction: body.disable_on_interaction,
    crossFade: body.cross_fade,
  };
}

export async function getBannerSettings(): Promise<BannerSettingsInput> {
  const response = await authorizedFetch("/api/v1/admin/home/banner");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load banner settings."));
  }
  return toBannerSettings((await response.json()) as ApiBannerRead);
}

export async function updateBannerSettings(input: BannerSettingsInput): Promise<BannerSettingsInput> {
  const response = await authorizedFetch("/api/v1/admin/home/banner", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_name: input.brandName.trim(),
      trust_line: input.trustLine.trim(),
      aria_label: input.ariaLabel.trim(),
      previous_label: input.previousLabel.trim(),
      next_label: input.nextLabel.trim(),
      slide_label: input.slideLabel.trim(),
      autoplay_delay_ms: input.autoplayDelayMs,
      transition_speed_ms: input.transitionSpeedMs,
      pause_on_hover: input.pauseOnHover,
      loop: input.loop,
      keyboard_enabled: input.keyboardEnabled,
      disable_on_interaction: input.disableOnInteraction,
      cross_fade: input.crossFade,
    }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save banner settings."));
  }
  return toBannerSettings((await response.json()) as ApiBannerRead);
}

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit hero slides.";
  return fallback;
}
