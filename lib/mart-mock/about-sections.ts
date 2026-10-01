import { aboutCopy } from "@/app/(client)/_data/about/about";

import { MOCK_EVENT } from "./store";

const KEY = "implesia.admin.about-sections.v1";

export type AboutLink = {
  label: string;
  href: string;
};

export type AboutImage = {
  id: string;
  src: string;
  alt: string;
};

export type AboutParagraph = {
  id: string;
  text: string;
};

export type AboutStatItem = {
  id: string;
  icon: string;
  value: string;
  label: string;
};

export type AboutFeatureItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type AboutStepItem = {
  id: string;
  step: string;
  icon: string;
  title: string;
  description: string;
};

export type AboutCard = {
  icon: string;
  title: string;
  description: string;
};

export type AboutHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: AboutLink;
  secondaryCta: AboutLink;
  images: AboutImage[];
};

export type AboutStoryBlock = {
  id: string;
  kicker: string;
  title: string;
  paragraphs: AboutParagraph[];
  cta: AboutLink;
  images: AboutImage[];
};

export type AboutDressContent = {
  kicker: string;
  title: string;
  subtitle: string;
  features: AboutFeatureItem[];
  primaryCta: AboutLink;
  secondaryCta: AboutLink;
  gallery: AboutImage[];
};

export type AboutValuesContent = {
  kicker: string;
  title: string;
  subtitle: string;
  items: AboutFeatureItem[];
};

export type AboutHowContent = {
  kicker: string;
  title: string;
  subtitle: string;
  steps: AboutStepItem[];
};

export type AboutCtaContent = {
  title: string;
  subtitle: string;
  primaryCta: AboutLink;
  secondaryCta: AboutLink;
};

export type AboutSections = {
  hero: AboutHeroContent;
  stats: AboutStatItem[];
  stories: AboutStoryBlock[];
  customDresses: AboutDressContent;
  mission: { vision: AboutCard; mission: AboutCard };
  values: AboutValuesContent;
  howItWorks: AboutHowContent;
  cta: AboutCtaContent;
};

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

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

function bnStep(n: number) {
  return String(n)
    .padStart(2, "0")
    .replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

function link(source: { label: string; href: string }): AboutLink {
  return { label: source.label, href: source.href };
}

export function seedAboutSections(): AboutSections {
  const {
    hero,
    story,
    customDresses,
    missionVision,
    values,
    howItWorks,
    shopCta,
  } = aboutCopy;

  return {
    hero: {
      eyebrow: hero.eyebrow,
      title: hero.title,
      subtitle: hero.subtitle,
      primaryCta: link(hero.primaryCta),
      secondaryCta: link(hero.secondaryCta),
      images: [
        { id: "hero-1", src: hero.imageSrc, alt: hero.imageAlt },
        {
          id: "hero-2",
          src: hero.secondaryImageSrc,
          alt: hero.secondaryImageAlt,
        },
      ],
    },
    stats: aboutCopy.stats.map((item, index) => ({
      id: `stat-${index + 1}`,
      icon: item.icon,
      value: item.value,
      label: item.label,
    })),
    stories: [
      {
        id: "story-1",
        kicker: story.kicker,
        title: story.title,
        paragraphs: story.paragraphs.map((text, index) => ({
          id: `story-${index + 1}`,
          text,
        })),
        cta: link(story.cta),
        images: story.images.map((image, index) => ({
          id: `story-image-${index + 1}`,
          src: image.src,
          alt: image.alt,
        })),
      },
    ],
    customDresses: {
      kicker: customDresses.kicker,
      title: customDresses.title,
      subtitle: customDresses.subtitle,
      features: customDresses.features.map((item, index) => ({
        id: `dress-feature-${index + 1}`,
        icon: item.icon,
        title: item.title,
        description: item.description,
      })),
      primaryCta: link(customDresses.primaryCta),
      secondaryCta: link(customDresses.secondaryCta),
      gallery: customDresses.gallery.map((image, index) => ({
        id: `dress-image-${index + 1}`,
        src: image.src,
        alt: image.alt,
      })),
    },
    mission: {
      vision: { ...missionVision.vision },
      mission: { ...missionVision.mission },
    },
    values: {
      kicker: values.kicker,
      title: values.title,
      subtitle: values.subtitle,
      items: values.items.map((item, index) => ({
        id: `value-${index + 1}`,
        icon: item.icon,
        title: item.title,
        description: item.description,
      })),
    },
    howItWorks: {
      kicker: howItWorks.kicker,
      title: howItWorks.title,
      subtitle: howItWorks.subtitle,
      steps: howItWorks.steps.map((item, index) => ({
        id: `step-${index + 1}`,
        step: item.step,
        icon: item.icon,
        title: item.title,
        description: item.description,
      })),
    },
    cta: {
      title: shopCta.title,
      subtitle: shopCta.subtitle,
      primaryCta: link(shopCta.primaryCta),
      secondaryCta: link(shopCta.secondaryCta),
    },
  };
}

type StoredAboutSections = Partial<AboutSections> & {
  story?: Omit<AboutStoryBlock, "id"> & { id?: string };
};

export function readAboutSections(): AboutSections {
  const seed = seedAboutSections();
  const stored = readJson<StoredAboutSections>(KEY);
  if (!stored) return seed;

  return {
    hero: {
      ...seed.hero,
      ...stored.hero,
      primaryCta: { ...seed.hero.primaryCta, ...stored.hero?.primaryCta },
      secondaryCta: { ...seed.hero.secondaryCta, ...stored.hero?.secondaryCta },
      images: stored.hero?.images ?? seed.hero.images,
    },
    stats: stored.stats ?? seed.stats,
    stories: readStories(seed.stories, stored),
    customDresses: {
      ...seed.customDresses,
      ...stored.customDresses,
      primaryCta: {
        ...seed.customDresses.primaryCta,
        ...stored.customDresses?.primaryCta,
      },
      secondaryCta: {
        ...seed.customDresses.secondaryCta,
        ...stored.customDresses?.secondaryCta,
      },
      features: stored.customDresses?.features ?? seed.customDresses.features,
      gallery: stored.customDresses?.gallery ?? seed.customDresses.gallery,
    },
    mission: {
      vision: { ...seed.mission.vision, ...stored.mission?.vision },
      mission: { ...seed.mission.mission, ...stored.mission?.mission },
    },
    values: {
      ...seed.values,
      ...stored.values,
      items: stored.values?.items ?? seed.values.items,
    },
    howItWorks: {
      ...seed.howItWorks,
      ...stored.howItWorks,
      steps: stored.howItWorks?.steps ?? seed.howItWorks.steps,
    },
    cta: {
      ...seed.cta,
      ...stored.cta,
      primaryCta: { ...seed.cta.primaryCta, ...stored.cta?.primaryCta },
      secondaryCta: { ...seed.cta.secondaryCta, ...stored.cta?.secondaryCta },
    },
  };
}

export function saveAboutSections(next: AboutSections) {
  writeJson(KEY, next);
}

export function blankAboutImage(): AboutImage {
  return { id: newId("image"), src: "", alt: "" };
}

export function blankParagraph(): AboutParagraph {
  return { id: newId("paragraph"), text: "" };
}

export function blankStory(): AboutStoryBlock {
  return {
    id: newId("story"),
    kicker: "",
    title: "",
    paragraphs: [blankParagraph()],
    cta: { label: "", href: "" },
    images: [blankAboutImage()],
  };
}

function readStories(
  seed: AboutStoryBlock[],
  stored: StoredAboutSections,
): AboutStoryBlock[] {
  if (Array.isArray(stored.stories))
    return stored.stories.map((item, index) => normalizeStory(item, index));
  if (stored.story) {
    const base = seed[0];
    return [
      normalizeStory(
        {
          id: "story-1",
          kicker: stored.story.kicker ?? base?.kicker,
          title: stored.story.title ?? base?.title,
          paragraphs: stored.story.paragraphs ?? base?.paragraphs,
          cta: {
            label: stored.story.cta?.label ?? base?.cta.label ?? "",
            href: stored.story.cta?.href ?? base?.cta.href ?? "",
          },
          images: stored.story.images ?? base?.images,
        },
        0,
      ),
    ];
  }
  return seed;
}

function normalizeStory(
  item: Partial<AboutStoryBlock>,
  index: number,
): AboutStoryBlock {
  return {
    id: item.id || `story-${index + 1}`,
    kicker: item.kicker ?? "",
    title: item.title ?? "",
    paragraphs: item.paragraphs ?? [],
    cta: { label: item.cta?.label ?? "", href: item.cta?.href ?? "" },
    images: item.images ?? [],
  };
}

export function blankStat(): AboutStatItem {
  return { id: newId("stat"), icon: "verified", value: "", label: "" };
}

export function blankFeature(): AboutFeatureItem {
  return { id: newId("feature"), icon: "verified", title: "", description: "" };
}

export function blankStep(count: number): AboutStepItem {
  return {
    id: newId("step"),
    step: bnStep(count + 1),
    icon: "task_alt",
    title: "",
    description: "",
  };
}

export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}
