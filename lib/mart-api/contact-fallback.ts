import { WHATSAPP_HREF, contactCopy } from "@/app/(client)/_data/contact/contact";

export const FALLBACK_CONTACT_DETAILS = {
  isActive: true,
  title: contactCopy.direct.title,
  subtitle: contactCopy.direct.subtitle,
  badge: contactCopy.direct.badge,
  channels: contactCopy.direct.channels.map((item, index) => ({
    id: `fallback-${index + 1}`,
    icon: item.icon,
    title: item.title,
    value: item.value,
    href: item.icon === "chat" ? WHATSAPP_HREF : item.href,
    isActive: true,
  })),
  social: contactCopy.direct.social.map((item) => ({
    platform: item.platform,
    label: item.label,
    href: item.href,
    isActive: true,
  })),
};

/*
 * Field-level fallbacks. A live CMS section (non-empty title) keeps its own copy;
 * any blank field or empty list inside it is filled from the bundled defaults
 * (the official site phone, email and hours), so the layout never collapses.
 * A fully blank public response means the admin hid the section and stays hidden.
 */

type Field = { label: string; placeholder: string };
type FormLike = {
  isActive: boolean;
  title: string;
  subtitle: string;
  cta: string;
  hint: string;
  fields: { name: Field; phone: Field; subject: Field; message: Field };
};

const or = (value: string, fallback: string) => (value.trim() ? value : fallback);

export const FALLBACK_CONTACT_FORM: FormLike = {
  isActive: true,
  title: contactCopy.form.title,
  subtitle: contactCopy.form.subtitle,
  cta: contactCopy.form.cta,
  hint: contactCopy.form.hint,
  fields: {
    name: { ...contactCopy.form.fields.name },
    phone: { ...contactCopy.form.fields.phone },
    subject: { ...contactCopy.form.fields.subject },
    message: { ...contactCopy.form.fields.message },
  },
};

export function fillContactForm<T extends FormLike>(form: T): T {
  if (!form.isActive) return form;
  const d = FALLBACK_CONTACT_FORM;
  const field = (k: keyof FormLike["fields"]) => ({
    label: or(form.fields[k].label, d.fields[k].label),
    placeholder: or(form.fields[k].placeholder, d.fields[k].placeholder),
  });
  return {
    ...form,
    cta: or(form.cta, d.cta),
    fields: { name: field("name"), phone: field("phone"), subject: field("subject"), message: field("message") },
  };
}

type DetailsLike = {
  isActive: boolean;
  title: string;
  channels: { id: string; icon: string; title: string; value: string; href: string; isActive: boolean }[];
  social: { platform: string; label: string; href: string; isActive: boolean }[];
};

export function fillContactDetails<T extends DetailsLike>(details: T): T {
  if (!details.isActive) return details;
  const channels = details.channels.filter((c) => c.isActive && c.value.trim());
  return {
    ...details,
    channels: channels.length ? details.channels : FALLBACK_CONTACT_DETAILS.channels,
    social: details.social.map((s) => {
      const d = FALLBACK_CONTACT_DETAILS.social.find((f) => f.platform === s.platform);
      return { ...s, label: or(s.label, d?.label ?? ""), href: or(s.href, s.isActive ? (d?.href ?? "") : "") };
    }),
  };
}

type Hour = { id: string; label: string; value: string; isActive: boolean };
type QuickLink = { id: string; icon: string; label: string; href: string; isActive: boolean };
type SupportLike = { isActive: boolean; title: string; subtitle: string; hours: Hour[]; quickLinks: QuickLink[] };

export const FALLBACK_CONTACT_SUPPORT: SupportLike = {
  isActive: true,
  title: contactCopy.support.title,
  subtitle: contactCopy.support.subtitle,
  hours: contactCopy.support.hours.map((h, i) => ({ id: `fallback-hour-${i + 1}`, ...h, isActive: true })),
  quickLinks: contactCopy.support.quickLinks.map((l, i) => ({ id: `fallback-link-${i + 1}`, ...l, isActive: true })),
};

export function fillContactSupport<T extends SupportLike>(support: T): T {
  if (!support.isActive) return support;
  const has = <I extends { isActive: boolean; label: string }>(items: I[]) => items.some((i) => i.isActive && i.label.trim());
  return {
    ...support,
    hours: has(support.hours) ? support.hours : FALLBACK_CONTACT_SUPPORT.hours,
    quickLinks: has(support.quickLinks) ? support.quickLinks : FALLBACK_CONTACT_SUPPORT.quickLinks,
  };
}

type FaqItem = { id: string; question: string; answer: string; isActive: boolean };
type FaqLike = { isActive: boolean; title: string; subtitle: string; items: FaqItem[] };

export const FALLBACK_CONTACT_FAQ: FaqLike = {
  isActive: true,
  title: contactCopy.faq.title,
  subtitle: contactCopy.faq.subtitle,
  items: contactCopy.faq.items.map((item) => ({ ...item, isActive: true })),
};

export function fillContactFaq<T extends FaqLike>(faq: T): T {
  if (!faq.isActive) return faq;
  const live = faq.items.some((i) => i.isActive && i.question.trim());
  return { ...faq, items: live ? faq.items : FALLBACK_CONTACT_FAQ.items };
}
