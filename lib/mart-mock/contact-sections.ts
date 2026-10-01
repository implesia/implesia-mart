import { contactCopy } from "@/app/(client)/_data/contact/contact";

import { MOCK_EVENT } from "./store";

const KEY = "implesia.admin.contact-sections.v1";

export type ContactLink = { label: string; href: string };
export type ContactFieldCopy = { label: string; placeholder: string };
export type ContactChannelItem = {
  id: string;
  icon: string;
  title: string;
  value: string;
  href: string;
  isActive?: boolean;
};
export type ContactHour = { id: string; label: string; value: string; isActive?: boolean };
export type ContactQuickLinkItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
  isActive?: boolean;
};
export type ContactSocialItem = {
  platform: "facebook" | "linkedin";
  label: string;
  href: string;
  isActive?: boolean;
};
export type ContactFaqRecord = {
  id: string;
  question: string;
  answer: string;
  isActive?: boolean;
};

export type ContactHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: ContactLink;
  secondaryCta: ContactLink;
  isActive?: boolean;
};

export type ContactFormContent = {
  title: string;
  subtitle: string;
  fields: {
    name: ContactFieldCopy;
    phone: ContactFieldCopy;
    subject: ContactFieldCopy;
    message: ContactFieldCopy;
  };
  cta: string;
  hint: string;
  isActive?: boolean;
};

export type ContactDirectContent = {
  title: string;
  subtitle: string;
  channels: ContactChannelItem[];
  badge: string;
  social: ContactSocialItem[];
  isActive?: boolean;
};

export type ContactSupportContent = {
  title: string;
  subtitle: string;
  hours: ContactHour[];
  quickLinks: ContactQuickLinkItem[];
  isActive?: boolean;
};

export type ContactFaqContent = {
  title: string;
  subtitle: string;
  items: ContactFaqRecord[];
  isActive?: boolean;
};

export type ContactSections = {
  hero: ContactHeroContent;
  form: ContactFormContent;
  direct: ContactDirectContent;
  support: ContactSupportContent;
  faq: ContactFaqContent;
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

function link(source: { label: string; href: string }): ContactLink {
  return { label: source.label, href: source.href };
}

function field(source: { label: string; placeholder: string }): ContactFieldCopy {
  return { label: source.label, placeholder: source.placeholder };
}

export function seedContactSections(): ContactSections {
  const { hero, form, direct, support, faq } = contactCopy;
  return {
    hero: {
      eyebrow: hero.eyebrow,
      title: hero.title,
      subtitle: hero.subtitle,
      primaryCta: link(hero.primaryCta),
      secondaryCta: link(hero.secondaryCta),
    },
    form: {
      title: form.title,
      subtitle: form.subtitle,
      fields: {
        name: field(form.fields.name),
        phone: field(form.fields.phone),
        subject: field(form.fields.subject),
        message: field(form.fields.message),
      },
      cta: form.cta,
      hint: form.hint,
    },
    direct: {
      title: direct.title,
      subtitle: direct.subtitle,
      channels: direct.channels.map((item, index) => ({
        id: `channel-${index + 1}`,
        icon: item.icon,
        title: item.title,
        value: item.value,
        href: item.href,
      })),
      badge: direct.badge,
      social: direct.social.map((item) => ({
        platform: item.platform,
        label: item.label,
        href: item.href,
      })),
    },
    support: {
      title: support.title,
      subtitle: support.subtitle,
      hours: support.hours.map((item, index) => ({
        id: `hour-${index + 1}`,
        label: item.label,
        value: item.value,
      })),
      quickLinks: support.quickLinks.map((item, index) => ({
        id: `link-${index + 1}`,
        icon: item.icon,
        label: item.label,
        href: item.href,
      })),
    },
    faq: {
      title: faq.title,
      subtitle: faq.subtitle,
      items: faq.items.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
      })),
    },
  };
}

function mergeSocial(
  stored: ContactSocialItem[] | undefined,
  seed: ContactSocialItem[],
) {
  return seed.map((item) => {
    const next = stored?.find((social) => social.platform === item.platform);
    return next
      ? { platform: item.platform, label: next.label, href: next.href }
      : item;
  });
}

export function readContactSections(): ContactSections {
  const seed = seedContactSections();
  const stored = readJson<Partial<ContactSections>>(KEY);
  if (!stored) return seed;
  return {
    hero: {
      ...seed.hero,
      ...stored.hero,
      primaryCta: { ...seed.hero.primaryCta, ...stored.hero?.primaryCta },
      secondaryCta: { ...seed.hero.secondaryCta, ...stored.hero?.secondaryCta },
    },
    form: {
      ...seed.form,
      ...stored.form,
      fields: {
        name: { ...seed.form.fields.name, ...stored.form?.fields?.name },
        phone: { ...seed.form.fields.phone, ...stored.form?.fields?.phone },
        subject: {
          ...seed.form.fields.subject,
          ...stored.form?.fields?.subject,
        },
        message: {
          ...seed.form.fields.message,
          ...stored.form?.fields?.message,
        },
      },
    },
    direct: {
      ...seed.direct,
      ...stored.direct,
      channels: stored.direct?.channels ?? seed.direct.channels,
      social: mergeSocial(stored.direct?.social, seed.direct.social),
    },
    support: {
      ...seed.support,
      ...stored.support,
      hours: stored.support?.hours ?? seed.support.hours,
      quickLinks: stored.support?.quickLinks ?? seed.support.quickLinks,
    },
    faq: {
      ...seed.faq,
      ...stored.faq,
      items: stored.faq?.items ?? seed.faq.items,
    },
  };
}

export function saveContactSections(next: ContactSections) {
  writeJson(KEY, next);
}

export function blankContactChannel(): ContactChannelItem {
  return { id: newId("channel"), icon: "call", title: "", value: "", href: "", isActive: true };
}

export function blankContactHour(): ContactHour {
  return { id: newId("hour"), label: "", value: "", isActive: true };
}

export function blankContactLink(): ContactQuickLinkItem {
  return { id: newId("link"), icon: "help", label: "", href: "", isActive: true };
}

export function blankContactFaq(): ContactFaqRecord {
  return { id: newId("faq"), question: "", answer: "", isActive: true };
}
