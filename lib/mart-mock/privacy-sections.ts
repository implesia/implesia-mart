import { WHATSAPP_HREF } from "@/app/(client)/_data/contact/contact";
import { privacyPolicyCopy } from "@/app/(client)/_data/privacy/privacy-policy";

import { MOCK_EVENT } from "./store";

const KEY = "implesia.admin.privacy-sections.v1";

export type PrivacyParagraph = { id: string; text: string; isActive?: boolean };
export type PrivacyCard = {
  id: string;
  icon: string;
  title: string;
  description: string;
  isActive?: boolean;
};
export type PrivacyUseItem = {
  id: string;
  title: string;
  description: string;
  isActive?: boolean;
};
export type PrivacyBadge = {
  id: string;
  icon: string;
  label: string;
  isActive?: boolean;
};
export type PrivacyChip = { id: string; label: string; isActive?: boolean };
export type PrivacyNote = { title: string; body: string; isActive?: boolean };

export type PrivacyHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  updatedLabel: string;
  lastUpdated: string;
  isActive?: boolean;
};
export type PrivacyContentsContent = {
  title: string;
  subtitle: string;
  navLabel: string;
  isActive?: boolean;
};
export type PrivacyIntroduction = {
  icon: string;
  navLabel: string;
  heading: string;
  paragraphs: PrivacyParagraph[];
  isActive?: boolean;
};
export type PrivacyCollection = {
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  cards: PrivacyCard[];
  isActive?: boolean;
};
export type PrivacyUsage = {
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  items: PrivacyUseItem[];
  protection: PrivacyNote & { icon: string; badges: PrivacyBadge[] };
  isActive?: boolean;
};
export type PrivacySharing = {
  icon: string;
  navLabel: string;
  heading: string;
  body: string;
  chips: PrivacyChip[];
  isActive?: boolean;
};
export type PrivacyRights = {
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  items: PrivacyCard[];
  retention: PrivacyNote;
  updates: PrivacyNote;
  isActive?: boolean;
};
export type PrivacySupportContent = {
  icon: string;
  navLabel: string;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  isActive?: boolean;
};

export type PrivacySections = {
  hero: PrivacyHeroContent;
  contents: PrivacyContentsContent;
  introduction: PrivacyIntroduction;
  collection: PrivacyCollection;
  usage: PrivacyUsage;
  sharing: PrivacySharing;
  rights: PrivacyRights;
  support: PrivacySupportContent;
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
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function nav(id: string) {
  return privacyPolicyCopy.nav.items.find((item) => item.id === id);
}

export function seedPrivacySections(): PrivacySections {
  const copy = privacyPolicyCopy;
  return {
    hero: {
      eyebrow: copy.hero.eyebrow,
      title: copy.hero.title,
      subtitle: copy.hero.subtitle,
      updatedLabel: "সর্বশেষ আপডেট:",
      lastUpdated: copy.lastUpdated,
    },
    contents: {
      title: copy.nav.title,
      subtitle: copy.nav.subtitle,
      navLabel: "গোপনীয়তা সেকশন",
    },
    introduction: {
      icon: nav("introduction")?.icon ?? "info",
      navLabel: nav("introduction")?.label ?? copy.introduction.heading,
      heading: copy.introduction.heading,
      paragraphs: copy.introduction.paragraphs.map((text, index) => ({
        id: `intro-${index + 1}`,
        text,
      })),
    },
    collection: {
      icon: nav("collection")?.icon ?? "database",
      navLabel: nav("collection")?.label ?? copy.collection.heading,
      heading: copy.collection.heading,
      intro: copy.collection.intro,
      cards: copy.collection.cards.map((card, index) => ({
        id: `collect-${index + 1}`,
        icon: card.icon,
        title: card.title,
        description: card.description,
      })),
    },
    usage: {
      icon: nav("usage")?.icon ?? "query_stats",
      navLabel: nav("usage")?.label ?? copy.usage.heading,
      heading: copy.usage.heading,
      intro: copy.usage.intro,
      items: copy.usage.items.map((item, index) => ({
        id: `use-${index + 1}`,
        title: item.title,
        description: item.description,
      })),
      protection: {
        icon: "verified_user",
        title: copy.usage.protection.title,
        body: copy.usage.protection.body,
        badges: copy.usage.protection.badges.map((badge, index) => ({
          id: `badge-${index + 1}`,
          icon: badge.icon,
          label: badge.label,
        })),
      },
    },
    sharing: {
      icon: nav("sharing")?.icon ?? "share",
      navLabel: nav("sharing")?.label ?? copy.sharing.heading,
      heading: copy.sharing.heading,
      body: copy.sharing.body,
      chips: copy.sharing.chips.map((label, index) => ({
        id: `chip-${index + 1}`,
        label,
      })),
    },
    rights: {
      icon: nav("rights")?.icon ?? "gavel",
      navLabel: nav("rights")?.label ?? copy.rights.heading,
      heading: copy.rights.heading,
      intro: copy.rights.intro,
      items: copy.rights.items.map((item, index) => ({
        id: `right-${index + 1}`,
        icon: item.icon,
        title: item.title,
        description: item.description,
      })),
      retention: { ...copy.rights.retention },
      updates: { ...copy.rights.updates },
    },
    support: {
      icon: nav("support")?.icon ?? "support_agent",
      navLabel: nav("support")?.label ?? "যোগাযোগ",
      title: copy.support.title,
      subtitle: copy.support.subtitle,
      email: copy.support.email,
      phone: copy.support.phone,
      primaryLabel: copy.support.cta,
      primaryHref: "/contact-us",
      secondaryLabel: copy.support.whatsapp,
      secondaryHref: WHATSAPP_HREF,
    },
  };
}

export function readPrivacySections(): PrivacySections {
  const seed = seedPrivacySections();
  const stored = readJson<Partial<PrivacySections>>(KEY);
  if (!stored) return seed;
  return {
    hero: { ...seed.hero, ...stored.hero },
    contents: { ...seed.contents, ...stored.contents },
    introduction: {
      ...seed.introduction,
      ...stored.introduction,
      paragraphs:
        stored.introduction?.paragraphs ?? seed.introduction.paragraphs,
    },
    collection: {
      ...seed.collection,
      ...stored.collection,
      cards: stored.collection?.cards ?? seed.collection.cards,
    },
    usage: {
      ...seed.usage,
      ...stored.usage,
      items: stored.usage?.items ?? seed.usage.items,
      protection: {
        ...seed.usage.protection,
        ...stored.usage?.protection,
        badges:
          stored.usage?.protection?.badges ?? seed.usage.protection.badges,
      },
    },
    sharing: {
      ...seed.sharing,
      ...stored.sharing,
      chips: stored.sharing?.chips ?? seed.sharing.chips,
    },
    rights: {
      ...seed.rights,
      ...stored.rights,
      items: stored.rights?.items ?? seed.rights.items,
      retention: { ...seed.rights.retention, ...stored.rights?.retention },
      updates: { ...seed.rights.updates, ...stored.rights?.updates },
    },
    support: { ...seed.support, ...stored.support },
  };
}

export function savePrivacySections(sections: PrivacySections) {
  writeJson(KEY, sections);
}

export function blankParagraph(): PrivacyParagraph {
  return { id: newId("para"), text: "", isActive: true };
}
export function blankPrivacyCard(icon = "info"): PrivacyCard {
  return {
    id: newId("card"),
    icon,
    title: "",
    description: "",
    isActive: true,
  };
}
export function blankUseItem(): PrivacyUseItem {
  return { id: newId("use"), title: "", description: "", isActive: true };
}
export function blankBadge(): PrivacyBadge {
  return { id: newId("badge"), icon: "lock", label: "", isActive: true };
}
export function blankChip(): PrivacyChip {
  return { id: newId("chip"), label: "", isActive: true };
}

export function moveList<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}
