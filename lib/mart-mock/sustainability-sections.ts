import { sustainabilityCopy } from "@/app/(client)/_data/sustainability/sustainability";

import { MOCK_EVENT } from "./store";

const KEY = "implesia.admin.sustainability-sections.v1";

export type SustainLink = { label: string; href: string };
export type SustainImage = { id: string; src: string; alt: string; isActive?: boolean };
export type SustainMedia = { src: string; alt: string };
export type SustainStat = { id: string; icon: string; value: string; label: string; isActive?: boolean };
export type SustainCard = { id: string; icon: string; title: string; description: string; isActive?: boolean };
export type SustainTextItem = { id: string; text: string; isActive?: boolean };
export type SustainBadge = { id: string; icon: string; label: string; isActive?: boolean };

export type SustainHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: SustainLink;
  secondaryCta: SustainLink;
  primaryImage: SustainMedia;
  secondaryImage: SustainMedia;
};

export type SustainImpact = {
  kicker: string;
  title: string;
  subtitle: string;
  stats: SustainStat[];
};

export type SustainOrigin = {
  eyebrow: string;
  title: string;
  body: string;
  quote: string;
  images: SustainImage[];
};

export type SustainCommitment = {
  kicker: string;
  title: string;
  subtitle: string;
  items: SustainCard[];
};

export type SustainQuality = {
  title: string;
  body: string;
  image: SustainMedia;
  steps: SustainTextItem[];
  badges: SustainBadge[];
};

export type SustainDurability = {
  title: string;
  body: string;
  bullets: SustainTextItem[];
  image: SustainMedia;
};

export type SustainCta = {
  title: string;
  subtitle: string;
  primaryCta: SustainLink;
  secondaryCta: SustainLink;
};

export type SustainabilitySections = {
  hero: SustainHero;
  impact: SustainImpact;
  origin: SustainOrigin;
  commitment: SustainCommitment;
  quality: SustainQuality;
  durability: SustainDurability;
  cta: SustainCta;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(MOCK_EVENT));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function link(source: { label: string; href: string }): SustainLink {
  return { label: source.label, href: source.href };
}

export function seedSustainabilitySections(): SustainabilitySections {
  const { hero, impact, origin, commitment, quality, durability, cta } = sustainabilityCopy;
  return {
    hero: {
      eyebrow: hero.eyebrow,
      title: hero.title,
      subtitle: hero.subtitle,
      primaryCta: link(hero.primaryCta),
      secondaryCta: link(hero.secondaryCta),
      primaryImage: { src: hero.imageSrc, alt: hero.imageAlt },
      secondaryImage: { src: hero.secondaryImageSrc, alt: hero.secondaryImageAlt },
    },
    impact: {
      kicker: impact.kicker,
      title: impact.title,
      subtitle: impact.subtitle,
      stats: impact.stats.map((item, index) => ({
        id: `impact-${index + 1}`,
        icon: item.icon,
        value: item.value,
        label: item.label,
      })),
    },
    origin: {
      eyebrow: origin.eyebrow,
      title: origin.title,
      body: origin.body,
      quote: origin.quote,
      images: origin.images.map((image, index) => ({
        id: `origin-${index + 1}`,
        src: image.src,
        alt: image.alt,
      })),
    },
    commitment: {
      kicker: commitment.kicker,
      title: commitment.title,
      subtitle: commitment.subtitle,
      items: commitment.items.map((item, index) => ({
        id: `commit-${index + 1}`,
        icon: item.icon,
        title: item.title,
        description: item.description,
      })),
    },
    quality: {
      title: quality.title,
      body: quality.body,
      image: { src: quality.imageSrc, alt: quality.imageAlt },
      steps: quality.steps.map((text, index) => ({ id: `quality-step-${index + 1}`, text })),
      badges: quality.badges.map((item, index) => ({
        id: `quality-badge-${index + 1}`,
        icon: item.icon,
        label: item.label,
      })),
    },
    durability: {
      title: durability.title,
      body: durability.body,
      bullets: durability.bullets.map((text, index) => ({ id: `durability-${index + 1}`, text })),
      image: { src: durability.imageSrc, alt: durability.imageAlt },
    },
    cta: {
      title: cta.title,
      subtitle: cta.subtitle,
      primaryCta: link(cta.primaryCta),
      secondaryCta: link(cta.secondaryCta),
    },
  };
}

export function readSustainabilitySections(): SustainabilitySections {
  const seed = seedSustainabilitySections();
  const stored = readJson<Partial<SustainabilitySections>>(KEY);
  if (!stored) return seed;
  return {
    hero: {
      ...seed.hero,
      ...stored.hero,
      primaryCta: { ...seed.hero.primaryCta, ...stored.hero?.primaryCta },
      secondaryCta: { ...seed.hero.secondaryCta, ...stored.hero?.secondaryCta },
      primaryImage: { ...seed.hero.primaryImage, ...stored.hero?.primaryImage },
      secondaryImage: { ...seed.hero.secondaryImage, ...stored.hero?.secondaryImage },
    },
    impact: {
      ...seed.impact,
      ...stored.impact,
      stats: stored.impact?.stats ?? seed.impact.stats,
    },
    origin: {
      ...seed.origin,
      ...stored.origin,
      images: stored.origin?.images ?? seed.origin.images,
    },
    commitment: {
      ...seed.commitment,
      ...stored.commitment,
      items: stored.commitment?.items ?? seed.commitment.items,
    },
    quality: {
      ...seed.quality,
      ...stored.quality,
      image: { ...seed.quality.image, ...stored.quality?.image },
      steps: stored.quality?.steps ?? seed.quality.steps,
      badges: stored.quality?.badges ?? seed.quality.badges,
    },
    durability: {
      ...seed.durability,
      ...stored.durability,
      image: { ...seed.durability.image, ...stored.durability?.image },
      bullets: stored.durability?.bullets ?? seed.durability.bullets,
    },
    cta: {
      ...seed.cta,
      ...stored.cta,
      primaryCta: { ...seed.cta.primaryCta, ...stored.cta?.primaryCta },
      secondaryCta: { ...seed.cta.secondaryCta, ...stored.cta?.secondaryCta },
    },
  };
}

export function saveSustainabilitySections(next: SustainabilitySections) {
  writeJson(KEY, next);
}

export function blankSustainImage(): SustainImage {
  return { id: newId("image"), src: "", alt: "", isActive: true };
}

export function blankSustainStat(): SustainStat {
  return { id: newId("stat"), icon: "verified", value: "", label: "", isActive: true };
}

export function blankSustainCard(): SustainCard {
  return { id: newId("card"), icon: "verified", title: "", description: "", isActive: true };
}

export function blankSustainText(): SustainTextItem {
  return { id: newId("text"), text: "", isActive: true };
}

export function blankSustainBadge(): SustainBadge {
  return { id: newId("badge"), icon: "check_circle", label: "", isActive: true };
}
