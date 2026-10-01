import { WHATSAPP_HREF } from "@/app/(client)/_data/contact/contact";
import { shippingReturnsCopy } from "@/app/(client)/_data/shipping/shipping-returns";

import { MOCK_EVENT } from "./store";

const KEY = "implesia.admin.shipping-sections.v1";

export type ShippingCard = {
  id: string;
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  variant: "default" | "primary";
  isActive?: boolean;
};
export type ShippingTimelineItem = {
  id: string;
  label: string;
  value: string;
  isActive?: boolean;
};
export type ShippingNote = {
  id: string;
  icon: string;
  title: string;
  body: string;
  isActive?: boolean;
};
export type PaymentCardItem = {
  id: string;
  icon: string;
  badge: string;
  title: string;
  body: string;
  footnote: string;
  isActive?: boolean;
};
export type ReturnRule = { id: string; text: string; isActive?: boolean };
export type RefundStep = { id: string; title: string; body: string; isActive?: boolean };
export type ShippingFaqItem = {
  id: string;
  question: string;
  answer: string;
  isActive?: boolean;
};

export type ShippingHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  isActive?: boolean;
};
export type ShippingContentsContent = {
  title: string;
  subtitle: string;
  navLabel: string;
  isActive?: boolean;
};
export type ShippingBlock = {
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  cards: ShippingCard[];
  timelinesTitle: string;
  timelines: ShippingTimelineItem[];
  notes: ShippingNote[];
  isActive?: boolean;
};
export type PaymentBlock = {
  icon: string;
  navLabel: string;
  heading: string;
  intro: string;
  cards: PaymentCardItem[];
  isActive?: boolean;
};
export type ReturnsBlock = {
  icon: string;
  navLabel: string;
  heading: string;
  eligibilityTitle: string;
  eligibilityBody: string;
  rules: ReturnRule[];
  special: ShippingNote[];
  isActive?: boolean;
};
export type RefundBlock = {
  icon: string;
  navLabel: string;
  heading: string;
  steps: RefundStep[];
  note: string;
  isActive?: boolean;
};
export type ShippingSupportContent = {
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
export type ShippingFaqContent = {
  title: string;
  items: ShippingFaqItem[];
  moreBefore: string;
  moreLinkLabel: string;
  moreHref: string;
  moreAfter: string;
  isActive?: boolean;
};

export type ShippingSections = {
  hero: ShippingHeroContent;
  contents: ShippingContentsContent;
  shipping: ShippingBlock;
  payment: PaymentBlock;
  returns: ReturnsBlock;
  refund: RefundBlock;
  support: ShippingSupportContent;
  faq: ShippingFaqContent;
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
  return shippingReturnsCopy.nav.items.find((item) => item.id === id);
}

export function seedShippingSections(): ShippingSections {
  const copy = shippingReturnsCopy;
  return {
    hero: { ...copy.hero },
    contents: {
      title: copy.nav.title,
      subtitle: copy.nav.subtitle,
      navLabel: "শিপিং সেকশন",
    },
    shipping: {
      icon: nav("shipping")?.icon ?? "local_shipping",
      navLabel: nav("shipping")?.label ?? copy.shipping.heading,
      heading: copy.shipping.heading,
      intro: copy.shipping.intro,
      cards: copy.shipping.cards.map((card, index) => ({
        id: `ship-card-${index + 1}`,
        icon: card.icon,
        eyebrow: card.eyebrow,
        title: card.title,
        body: card.body,
        variant: card.variant === "primary" ? "primary" : "default",
      })),
      timelinesTitle: copy.shipping.timelinesTitle,
      timelines: copy.shipping.timelines.map((item, index) => ({
        id: `time-${index + 1}`,
        label: item.label,
        value: item.value,
      })),
      notes: copy.shipping.notes.map((item, index) => ({
        id: `note-${index + 1}`,
        icon: item.icon,
        title: item.title,
        body: item.body,
      })),
    },
    payment: {
      icon: nav("payment")?.icon ?? "payments",
      navLabel: nav("payment")?.label ?? copy.payment.heading,
      heading: copy.payment.heading,
      intro: copy.payment.intro,
      cards: copy.payment.cards.map((card, index) => ({
        id: `pay-${index + 1}`,
        icon: card.icon,
        badge: card.badge,
        title: card.title,
        body: card.body,
        footnote: card.footnote ?? "",
      })),
    },
    returns: {
      icon: nav("returns")?.icon ?? "assignment_return",
      navLabel: nav("returns")?.label ?? copy.returns.heading,
      heading: copy.returns.heading,
      eligibilityTitle: copy.returns.eligibilityTitle,
      eligibilityBody: copy.returns.eligibilityBody,
      rules: copy.returns.rules.map((text, index) => ({
        id: `rule-${index + 1}`,
        text,
      })),
      special: copy.returns.special.map((item, index) => ({
        id: `special-${index + 1}`,
        icon: item.icon,
        title: item.title,
        body: item.body,
      })),
    },
    refund: {
      icon: nav("refund")?.icon ?? "receipt_long",
      navLabel: nav("refund")?.label ?? copy.refund.heading,
      heading: copy.refund.heading,
      steps: copy.refund.steps.map((step, index) => ({
        id: `step-${index + 1}`,
        title: step.title,
        body: step.body,
      })),
      note: copy.refund.note,
    },
    support: {
      icon: nav("support")?.icon ?? "support_agent",
      navLabel: nav("support")?.label ?? "সাপোর্ট",
      title: copy.support.title,
      subtitle: copy.support.subtitle,
      email: copy.support.email,
      phone: copy.support.phone,
      primaryLabel: copy.support.cta,
      primaryHref: "/contact-us",
      secondaryLabel: copy.support.whatsapp,
      secondaryHref: WHATSAPP_HREF,
    },
    faq: {
      title: copy.miniFaq.title,
      items: copy.miniFaq.items.map((item) => ({
        id: item.id,
        question: item.q,
        answer: item.a,
      })),
      moreBefore: "আরও প্রশ্ন থাকলে",
      moreLinkLabel: "প্রশ্নোত্তর পেজ",
      moreHref: "/faqs",
      moreAfter: "দেখুন।",
    },
  };
}

export function readShippingSections(): ShippingSections {
  const seed = seedShippingSections();
  const stored = readJson<Partial<ShippingSections>>(KEY);
  if (!stored) return seed;
  return {
    hero: { ...seed.hero, ...stored.hero },
    contents: { ...seed.contents, ...stored.contents },
    shipping: {
      ...seed.shipping,
      ...stored.shipping,
      cards: stored.shipping?.cards ?? seed.shipping.cards,
      timelines: stored.shipping?.timelines ?? seed.shipping.timelines,
      notes: stored.shipping?.notes ?? seed.shipping.notes,
    },
    payment: {
      ...seed.payment,
      ...stored.payment,
      cards: stored.payment?.cards ?? seed.payment.cards,
    },
    returns: {
      ...seed.returns,
      ...stored.returns,
      rules: stored.returns?.rules ?? seed.returns.rules,
      special: stored.returns?.special ?? seed.returns.special,
    },
    refund: {
      ...seed.refund,
      ...stored.refund,
      steps: stored.refund?.steps ?? seed.refund.steps,
    },
    support: { ...seed.support, ...stored.support },
    faq: {
      ...seed.faq,
      ...stored.faq,
      items: stored.faq?.items ?? seed.faq.items,
    },
  };
}

export function saveShippingSections(sections: ShippingSections) {
  writeJson(KEY, sections);
}

export function blankShippingCard(): ShippingCard {
  return {
    id: newId("card"),
    icon: "local_shipping",
    eyebrow: "",
    title: "",
    body: "",
    variant: "default",
    isActive: true,
  };
}

export function blankTimeline(): ShippingTimelineItem {
  return { id: newId("time"), label: "", value: "", isActive: true };
}

export function blankNote(): ShippingNote {
  return { id: newId("note"), icon: "info", title: "", body: "", isActive: true };
}

export function blankPaymentCard(): PaymentCardItem {
  return {
    id: newId("pay"),
    icon: "payments",
    badge: "",
    title: "",
    body: "",
    footnote: "",
    isActive: true,
  };
}

export function blankRule(): ReturnRule {
  return { id: newId("rule"), text: "", isActive: true };
}

export function blankStep(): RefundStep {
  return { id: newId("step"), title: "", body: "", isActive: true };
}

export function blankShippingFaq(): ShippingFaqItem {
  return { id: newId("faq"), question: "", answer: "", isActive: true };
}

export function moveList<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}
