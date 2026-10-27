/**
 * Central site contact (phone, WhatsApp, email). The live values come from the API
 * (`/api/v1/site/contact`, edited under Admin -> Site -> Contact). The constants below
 * are only the built-in fallback shown when the API cannot be reached, and the seed the
 * backend migration starts from. Pure: no network, no React.
 */

export const SITE_CONTACT_DEFAULTS = {
  phone: "01580569129",
  whatsapp: "01580569129",
  email: "implesiamart@gmail.com",
} as const;

export type SiteContact = {
  /** Local Bangladesh format, e.g. 01580569129. */
  phone: string;
  whatsapp: string;
  email: string;
  telHref: string;
  whatsappHref: string;
  mailtoHref: string;
};

const LOCAL = /^01[3-9]\d{8}$/;
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

/** 01580569129 -> 8801580569129 (wa.me digits), or null when it is not a Bangladesh mobile. */
export function internationalDigits(local: string | undefined | null) {
  const value = (local ?? "").trim();
  return LOCAL.test(value) ? `880${value.slice(1)}` : null;
}

export function buildSiteContact(parts: { phone: string; whatsapp: string; email: string }): SiteContact {
  const phone = internationalDigits(parts.phone);
  const whatsapp = internationalDigits(parts.whatsapp);
  if (!phone || !whatsapp || !EMAIL.test(parts.email) || parts.email.length > 254) {
    throw new Error("Invalid site contact");
  }
  return {
    phone: parts.phone,
    whatsapp: parts.whatsapp,
    email: parts.email,
    telHref: `tel:+${phone}`,
    whatsappHref: `https://wa.me/${whatsapp}`,
    mailtoHref: `mailto:${parts.email}`,
  };
}

export const DEFAULT_SITE_CONTACT: SiteContact = buildSiteContact(SITE_CONTACT_DEFAULTS);

/** Validates an API payload; anything unusable falls back to the built-in contact. */
export function siteContactFrom(body: unknown): SiteContact {
  if (!body || typeof body !== "object") return DEFAULT_SITE_CONTACT;
  const { phone, whatsapp, email } = body as Record<string, unknown>;
  if (typeof phone !== "string" || typeof whatsapp !== "string" || typeof email !== "string") {
    return DEFAULT_SITE_CONTACT;
  }
  try {
    return buildSiteContact({ phone, whatsapp, email });
  } catch {
    return DEFAULT_SITE_CONTACT;
  }
}

/** wa.me link for a message to the central WhatsApp number. */
export function whatsappMessageHref(contact: SiteContact, message: string) {
  return `${contact.whatsappHref}?text=${encodeURIComponent(message)}`;
}

/** Client-side check used by the admin form before it calls the API (the API re-checks). */
export function siteContactDraftError(draft: { phone: string; whatsapp: string; email: string }) {
  const phoneOk = (value: string) => normalizePhoneInput(value) !== null;
  if (!phoneOk(draft.phone)) return "Phone must be a Bangladesh mobile number such as 01580569129.";
  if (!phoneOk(draft.whatsapp)) return "WhatsApp must be a Bangladesh mobile number such as 01580569129.";
  const email = draft.email.trim();
  if (!EMAIL.test(email) || email.length > 254) return "Enter a valid email address such as name@example.com.";
  return "";
}

/** Accepts +880 / 880 / 01 spellings with spaces, dashes, dots or brackets; returns 01XXXXXXXXX. */
export function normalizePhoneInput(value: string) {
  let digits = value.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+880")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("880")) digits = `0${digits.slice(3)}`;
  return LOCAL.test(digits) ? digits : null;
}
