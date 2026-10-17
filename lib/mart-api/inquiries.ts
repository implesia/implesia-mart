import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";
import {
  inquirySearch,
  type ApiCounts,
  type ApiInquiry,
  type Inquiry,
  type InquiryCounts,
  type InquiryDirectory,
  type InquiryQuery,
  type InquiryStatus,
} from "@/lib/mart-api/inquiry-public";

export * from "@/lib/mart-api/inquiry-public";

function toInquiry(body: ApiInquiry): Inquiry {
  return {
    id: body.id,
    publicId: body.public_id,
    type: body.type,
    status: body.status,
    name: body.name,
    email: body.email,
    phone: body.phone,
    subject: body.subject,
    message: body.message,
    meta: body.meta ?? {},
    adminNote: body.admin_note,
    handledByName: body.handled_by_name ?? "",
    createdAt: body.created_at,
    updatedAt: body.updated_at,
  };
}

function toCounts(body: ApiCounts): InquiryCounts {
  return { new: body.new, inProgress: body.in_progress, resolved: body.resolved, total: body.total };
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to see inquiries.";
  if (response.status === 403) return "Your role cannot open inquiries.";
  return fallback;
}

export async function listInquiries(query: InquiryQuery): Promise<InquiryDirectory> {
  const response = await authorizedFetch(`/api/v1/admin/inquiries?${inquirySearch(query)}`);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load inquiries."));
  const body = (await response.json()) as {
    items: ApiInquiry[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
    counts: ApiCounts;
  };
  return {
    items: body.items.map(toInquiry),
    total: body.total,
    page: body.page,
    pageSize: body.page_size,
    pages: body.pages,
    counts: toCounts(body.counts),
  };
}

export async function getInquiry(id: string): Promise<Inquiry> {
  const response = await authorizedFetch(`/api/v1/admin/inquiries/${encodeURIComponent(id)}`);
  if (!response.ok) throw new MartApiError(await readError(response, "Could not load this inquiry."));
  return toInquiry((await response.json()) as ApiInquiry);
}

export async function patchInquiry(id: string, patch: { status?: InquiryStatus; adminNote?: string }): Promise<Inquiry> {
  const response = await authorizedFetch(`/api/v1/admin/inquiries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.adminNote !== undefined ? { admin_note: patch.adminNote } : {}),
    }),
  });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not update this inquiry."));
  window.dispatchEvent(new Event(INQUIRIES_CHANGED));
  return toInquiry((await response.json()) as ApiInquiry);
}

export async function deleteInquiry(id: string): Promise<void> {
  const response = await authorizedFetch(`/api/v1/admin/inquiries/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) throw new MartApiError(await readError(response, "Could not delete this inquiry."));
  window.dispatchEvent(new Event(INQUIRIES_CHANGED));
}

export const INQUIRIES_CHANGED = "implesia-inquiries-changed";

export async function getInquiryCounts(): Promise<InquiryCounts | null> {
  try {
    const response = await authorizedFetch("/api/v1/admin/inquiries/counts");
    if (!response.ok) return null;
    return toCounts((await response.json()) as ApiCounts);
  } catch {
    return null;
  }
}

