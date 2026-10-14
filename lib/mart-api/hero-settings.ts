/** Carousel behaviour editable in the admin banner settings. */
export type HeroCarouselSettings = {
  brandName: string;
  trustLine: string;
  previousLabel: string;
  nextLabel: string;
  crossFade: boolean;
  ariaLabel: string;
  slideLabel: string;
  autoplayDelayMs: number;
  transitionSpeedMs: number;
  pauseOnHover: boolean;
  loop: boolean;
  keyboardEnabled: boolean;
  disableOnInteraction: boolean;
};

export const DEFAULT_HERO_SETTINGS: HeroCarouselSettings = {
  brandName: "Implesia Mart",
  trustLine: "সারাদেশে ক্যাশ অন ডেলিভারি · ৩ দিনের ইজি রিটার্ন",
  previousLabel: "আগের স্লাইড",
  nextLabel: "পরের স্লাইড",
  crossFade: true,
  ariaLabel: "ফিচার্ড প্রোডাক্ট",
  slideLabel: "স্লাইড",
  autoplayDelayMs: 5500,
  transitionSpeedMs: 700,
  pauseOnHover: true,
  loop: true,
  keyboardEnabled: true,
  disableOnInteraction: false,
};

export type ApiBannerSettings = {
  brand_name?: string;
  trust_line?: string;
  previous_label?: string;
  next_label?: string;
  cross_fade?: boolean;
  aria_label?: string;
  slide_label?: string;
  autoplay_delay_ms?: number;
  transition_speed_ms?: number;
  pause_on_hover?: boolean;
  loop?: boolean;
  keyboard_enabled?: boolean;
  disable_on_interaction?: boolean;
};

function positive(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function mapHeroSettings(body: ApiBannerSettings): HeroCarouselSettings {
  const base = DEFAULT_HERO_SETTINGS;
  return {
    brandName: text(body.brand_name, base.brandName),
    trustLine: text(body.trust_line, base.trustLine),
    previousLabel: text(body.previous_label, base.previousLabel),
    nextLabel: text(body.next_label, base.nextLabel),
    crossFade: flag(body.cross_fade, base.crossFade),
    ariaLabel: text(body.aria_label, base.ariaLabel),
    slideLabel: text(body.slide_label, base.slideLabel),
    autoplayDelayMs: positive(body.autoplay_delay_ms, base.autoplayDelayMs),
    transitionSpeedMs: positive(body.transition_speed_ms, base.transitionSpeedMs),
    pauseOnHover: flag(body.pause_on_hover, base.pauseOnHover),
    loop: flag(body.loop, base.loop),
    keyboardEnabled: flag(body.keyboard_enabled, base.keyboardEnabled),
    disableOnInteraction: flag(body.disable_on_interaction, base.disableOnInteraction),
  };
}
