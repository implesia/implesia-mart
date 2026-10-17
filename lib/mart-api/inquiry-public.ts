/**
 * Inquiry types and the public submit call. Kept free of the admin/product
 * modules so the storefront forms stay light.
 */
export const INQUIRY_TYPES = ["newsletter", "contact", "product_inquiry", "order_help", "other"] as const;
export const INQUIRY_STATUSES = ["new", "in_progress", "resolved"] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  newsletter: "Newsletter",
  contact: "Contact form",
  product_inquiry: "Product question",
  order_help: "Order help",
  other: "Other",
};
export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

export type InquiryMeta = { page_path?: string; product_id?: string; product_slug?: string; topic?: string };

export type InquiryInput = {
  type: InquiryType;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  meta?: InquiryMeta;
  website?: string;
  elapsedMs?: number;
};

export type Inquiry = {
  id: string;
  publicId: string;
  type: InquiryType;
  status: InquiryStatus;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  meta: InquiryMeta;
  adminNote: string;
  handledByName: string;
  createdAt: string;
  updatedAt: string;
};

export type InquiryCounts = { new: number; inProgress: number; resolved: number; total: number };
export type InquiryDirectory = {
  items: Inquiry[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  counts: InquiryCounts;
};

export type InquiryQuery = {
  q?: string;
  type?: InquiryType | null;
  status?: InquiryStatus | null;
  dateFrom?: string;
  dateTo?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export type ApiInquiry = {
  id: string;
  public_id: string;
  type: InquiryType;
  status: InquiryStatus;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  meta: InquiryMeta;
  admin_note: string;
  handled_by_name?: string;
  created_at: string;
  updated_at: string;
};
export type ApiCounts = { new: number; in_progress: number; resolved: number; total: number };

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

/** Friendly Bengali copy for the storefront; the API answers in English. */
export const SUBMIT_ERRORS = {
  network: "ইন্টারনেট সংযোগে সমস্যা — আপনার লেখা রাখা আছে, আবার চেষ্টা করুন।",
  rateLimited: "অল্প সময়ে অনেক মেসেজ এসেছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
  empty: "ইমেইল, ফোন নাম্বার বা মেসেজ — অন্তত একটি লিখুন।",
  invalid: "কিছু তথ্য ঠিক নেই — ইমেইল বা ফোন নাম্বার দেখে নিন।",
  server: "এই মুহূর্তে পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।",
} as const;

export class InquirySubmitError extends Error {
  readonly kind: keyof typeof SUBMIT_ERRORS;

  constructor(message: string, kind: keyof typeof SUBMIT_ERRORS) {
    super(message);
    this.name = "InquirySubmitError";
    this.kind = kind;
  }
}

export function newIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function inquiryBody(input: InquiryInput) {
  const trim = (value?: string) => (value ?? "").trim();
  return {
    type: input.type,
    name: trim(input.name),
    email: trim(input.email),
    phone: trim(input.phone),
    subject: trim(input.subject),
    message: trim(input.message),
    meta: input.meta ?? {},
    website: input.website ?? "",
    ...(input.elapsedMs === undefined ? {} : { elapsed_ms: Math.max(0, Math.round(input.elapsedMs)) }),
  };
}

export function hasInquiryContent(input: Pick<InquiryInput, "email" | "phone" | "message">) {
  return Boolean(input.email?.trim() || input.phone?.trim() || input.message?.trim());
}

/** Public submit. Reuse the same key when retrying the same message, so it is stored once. */
export async function submitInquiry(input: InquiryInput, idempotencyKey: string): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetch(`${API}/api/v1/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(inquiryBody(input)),
    });
  } catch {
    throw new InquirySubmitError(SUBMIT_ERRORS.network, "network");
  }
  if (response.status === 201) return (await response.json()) as { id: string };
  if (response.status === 429) throw new InquirySubmitError(SUBMIT_ERRORS.rateLimited, "rateLimited");
  if (response.status === 422) {
    const text = await response.text();
    const kind = /email, a phone number or a message/i.test(text) ? "empty" : "invalid";
    throw new InquirySubmitError(SUBMIT_ERRORS[kind], kind);
  }
  throw new InquirySubmitError(SUBMIT_ERRORS.server, "server");
}

export function inquirySearch(query: InquiryQuery) {
  const search = new URLSearchParams();
  if (query.q?.trim()) search.set("q", query.q.trim());
  if (query.type) search.set("type", query.type);
  if (query.status) search.set("status", query.status);
  if (query.dateFrom) search.set("date_from", query.dateFrom);
  if (query.dateTo) search.set("date_to", query.dateTo);
  if (query.sort && query.sort !== "newest") search.set("sort", query.sort);
  if (query.page && query.page > 1) search.set("page", String(query.page));
  search.set("page_size", String(query.pageSize ?? 20));
  return search.toString();
}

/** Digits for tel:/wa.me links from a stored 01XXXXXXXXX number. */
export function phoneLinks(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const intl = digits.startsWith("880") ? digits : digits.startsWith("0") ? `88${digits}` : digits;
  return { tel: `tel:+${intl}`, whatsapp: `https://wa.me/${intl}` };
}
