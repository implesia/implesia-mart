import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type FaqListing = {
  isActive: boolean;
  countSuffix: string;
  emptyTitle: string;
  emptyBody: string;
};

type ApiListing = {
  is_active?: boolean;
  count_suffix?: string;
  empty_title?: string;
  empty_body?: string;
};

function toListing(body: ApiListing, active: boolean): FaqListing {
  return {
    isActive: active,
    countSuffix: body.count_suffix ?? "",
    emptyTitle: body.empty_title ?? "",
    emptyBody: body.empty_body ?? "",
  };
}

function toBody(listing: FaqListing) {
  return {
    is_active: listing.isActive,
    count_suffix: listing.countSuffix,
    empty_title: listing.emptyTitle,
    empty_body: listing.emptyBody,
  };
}

export function faqListingHasCopy(listing: FaqListing) {
  return [listing.countSuffix, listing.emptyTitle, listing.emptyBody].some((value) => value.trim());
}

export async function getFaqListing(): Promise<FaqListing> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/listing");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the results."));
  }
  const body = (await response.json()) as ApiListing;
  return toListing(body, body.is_active !== false);
}

export async function saveFaqListing(listing: FaqListing): Promise<FaqListing> {
  const response = await authorizedFetch("/api/v1/admin/pages/faqs/listing", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(listing)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the results."));
  }
  const body = (await response.json()) as ApiListing;
  return toListing(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicFaqListing(): Promise<FaqListing | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/faqs/listing`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const listing = toListing((await response.json()) as ApiListing, true);
    if (!faqListingHasCopy(listing)) return { ...listing, isActive: false };
    return listing;
  } catch {
    return null;
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the FAQ page.";
  return fallback;
}
