/**
 * Pure helpers for the contact page: form validation, WhatsApp hand-off, copy
 * values and a strict parser for the CMS support hours ("শনি – বৃহস্পতি" /
 * "সকাল ৯টা – রাত ১০টা"). The parser returns null whenever it is not sure, so the
 * page never shows a misleading "open now" badge.
 */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toAsciiDigits(value: string) {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/** Bangladeshi mobile: 01XXXXXXXXX with optional +88 / 88; spaces and dashes ignored. */
export function normalizePhone(value: string) {
  const compact = toAsciiDigits(value).replace(/[\s\-().]/g, "");
  const match = compact.match(/^(?:\+?88)?(01[3-9]\d{8})$/);
  return match ? match[1] : null;
}

export const LIMITS = { name: 80, subject: 120, message: 1000 } as const;

export type ContactValues = { name: string; phone: string; subject: string; message: string };
export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

export const CONTACT_ERRORS = {
  nameLong: `নাম ${LIMITS.name} অক্ষরের মধ্যে লিখুন।`,
  phone: "সঠিক মোবাইল নাম্বার দিন, যেমন ০১৭XXXXXXXX — অথবা ঘরটি খালি রাখুন।",
  subjectLong: `বিষয় ${LIMITS.subject} অক্ষরের মধ্যে লিখুন।`,
  messageLong: `মেসেজ ${LIMITS.message} অক্ষরের মধ্যে লিখুন।`,
  empty: "ফোন নাম্বার বা মেসেজ — অন্তত একটি লিখুন, যাতে আমরা উত্তর দিতে পারি।",
} as const;

/** Every field is optional; a filled field must be valid. */
export function validateField(field: keyof ContactValues, raw: string): string | undefined {
  const value = raw.trim();
  switch (field) {
    case "name":
      return value.length > LIMITS.name ? CONTACT_ERRORS.nameLong : undefined;
    case "phone":
      return value && !normalizePhone(value) ? CONTACT_ERRORS.phone : undefined;
    case "subject":
      return value.length > LIMITS.subject ? CONTACT_ERRORS.subjectLong : undefined;
    case "message":
      return value.length > LIMITS.message ? CONTACT_ERRORS.messageLong : undefined;
  }
}

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  for (const field of ["name", "phone", "subject", "message"] as const) {
    const error = validateField(field, values[field]);
    if (error) errors[field] = error;
  }
  // Nothing to reply to: flag the message box (the phone box may be valid-but-empty).
  if (!values.phone.trim() && !values.message.trim()) errors.message = CONTACT_ERRORS.empty;
  return errors;
}

export function whatsAppNumber(href: string) {
  return href.match(/wa\.me\/(\d+)/)?.[1] ?? "";
}

export function composeWhatsAppMessage(values: ContactValues) {
  return [
    `হ্যালো, আমি ${values.name.trim()}।`,
    `ফোন: ${normalizePhone(values.phone) ?? values.phone.trim()}`,
    `বিষয়: ${values.subject.trim()}`,
    "",
    values.message.trim(),
  ].join("\n");
}

export function whatsAppChatHref(destination: string, text: string) {
  const number = whatsAppNumber(destination);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : "";
}

/** What a copy button should put on the clipboard for a contact channel, or null. */
export function copyValueFor(href: string, value: string) {
  const h = href.trim();
  if (h.startsWith("mailto:")) return decodeURIComponent(h.slice(7).split("?")[0]) || null;
  if (h.startsWith("tel:")) return h.slice(4).replace(/[^\d+]/g, "") || null;
  const wa = whatsAppNumber(h);
  if (wa) return `+${wa}`;
  return /@|\d{6,}/.test(toAsciiDigits(value)) ? value.trim() : null;
}

/* ---------- support hours ---------- */

// JS getDay(): 0 = Sunday … 6 = Saturday
const DAYS: [RegExp, number][] = [
  [/^(শনি|sat)/i, 6],
  [/^(রবি|sun)/i, 0],
  [/^(সোম|mon)/i, 1],
  [/^(মঙ্গল|tue)/i, 2],
  [/^(বুধ|wed)/i, 3],
  [/^(বৃহস্পতি|thu)/i, 4],
  [/^(শুক্র|fri)/i, 5],
];

const SEPARATOR = /\s*(?:–|—|-|থেকে|to)\s*/i;

function parseDay(token: string) {
  const t = token.trim();
  return DAYS.find(([re]) => re.test(t))?.[1];
}

/** "শনি – বৃহস্পতি" → [6,0,1,2,3,4]; "শুক্রবার" → [5]; "প্রতিদিন" → all. */
export function parseDays(label: string): number[] | null {
  const text = label.trim();
  if (/^(প্রতিদিন|everyday|daily)/i.test(text)) return [0, 1, 2, 3, 4, 5, 6];
  const parts = text.split(SEPARATOR).filter(Boolean);
  if (parts.length === 1) {
    const d = parseDay(parts[0]);
    return d === undefined ? null : [d];
  }
  if (parts.length !== 2) return null;
  const from = parseDay(parts[0]);
  const to = parseDay(parts[1]);
  if (from === undefined || to === undefined) return null;
  const out: number[] = [];
  for (let d = from; ; d = (d + 1) % 7) {
    out.push(d);
    if (d === to) break;
  }
  return out;
}

/** "সকাল ৯টা" → 540, "রাত ১০টা" → 1320, "দুপুর ২:৩০" → 870. Minutes after midnight. */
export function parseTime(token: string): number | null {
  const t = toAsciiDigits(token.trim()).toLowerCase();
  const m = t.match(/^(ভোর|সকাল|দুপুর|বিকাল|বিকেল|সন্ধ্যা|রাত)?\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:টা|টায়)?\s*(am|pm)?$/);
  if (!m) return null;
  const [, period, hh, mm, ampm] = m;
  let h = Number(hh);
  const min = mm ? Number(mm) : 0;
  if (h > 24 || min > 59) return null;
  if (ampm) {
    if (h > 12) return null;
    h = (h % 12) + (ampm === "pm" ? 12 : 0);
  } else if (period) {
    if (period === "দুপুর") h = h === 12 ? 12 : h < 6 ? h + 12 : h;
    else if (period === "বিকাল" || period === "বিকেল" || period === "সন্ধ্যা") h = h < 12 ? h + 12 : h;
    else if (period === "রাত") h = h === 12 ? 24 : h >= 6 ? h + 12 : h + 24;
  } else if (h <= 12) {
    return null; // "৯টা" alone is ambiguous
  }
  return h * 60 + min;
}

export type HoursRule = { days: number[]; open: number; close: number } | { days: number[]; closed: true };

export function parseHoursRow(label: string, value: string): HoursRule | null {
  const days = parseDays(label);
  if (!days) return null;
  if (/^(বন্ধ|closed)/i.test(value.trim())) return { days, closed: true };
  const parts = value.split(SEPARATOR).filter(Boolean);
  if (parts.length !== 2) return null;
  const open = parseTime(parts[0]);
  const close = parseTime(parts[1]);
  if (open === null || close === null || close <= open) return null;
  return { days, open, close };
}

/** All rows must parse, or there is no schedule at all. */
export function parseSchedule(rows: { label: string; value: string }[]): HoursRule[] | null {
  if (!rows.length) return null;
  const rules = rows.map((r) => parseHoursRow(r.label, r.value));
  return rules.every((r): r is HoursRule => r !== null) ? rules : null;
}

/** Day of week + minutes after midnight in Asia/Dhaka. */
export function dhakaClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus = { open: boolean; todayIndex: number | null };

/** Open/closed now in Dhaka; todayIndex is the CMS row that covers today (for highlighting). */
export function openStatus(rules: HoursRule[], now: Date): OpenStatus {
  const { day, minutes } = dhakaClock(now);
  const todayIndex = rules.findIndex((r) => r.days.includes(day));
  if (todayIndex === -1) return { open: false, todayIndex: null };
  const rule = rules[todayIndex];
  const open = !("closed" in rule) && minutes >= rule.open && minutes < rule.close;
  return { open, todayIndex };
}
