import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type BlogListing = {
  isActive: boolean;
  heading: string;
  allLabel: string;
  countSuffix: string;
  emptyMessage: string;
  featuredLabel: string;
  readLabel: string;
  readSuffix: string;
  tabsLabel: string;
};

type ApiListing = {
  is_active?: boolean;
  heading?: string;
  all_label?: string;
  count_suffix?: string;
  empty_message?: string;
  featured_label?: string;
  read_label?: string;
  read_suffix?: string;
  tabs_label?: string;
};

function toListing(body: ApiListing, active: boolean): BlogListing {
  return {
    isActive: active,
    heading: body.heading ?? "",
    allLabel: body.all_label ?? "",
    countSuffix: body.count_suffix ?? "",
    emptyMessage: body.empty_message ?? "",
    featuredLabel: body.featured_label ?? "",
    readLabel: body.read_label ?? "",
    readSuffix: body.read_suffix ?? "",
    tabsLabel: body.tabs_label ?? "",
  };
}

function toBody(listing: BlogListing) {
  return {
    is_active: listing.isActive,
    heading: listing.heading,
    all_label: listing.allLabel,
    count_suffix: listing.countSuffix,
    empty_message: listing.emptyMessage,
    featured_label: listing.featuredLabel,
    read_label: listing.readLabel,
    read_suffix: listing.readSuffix,
    tabs_label: listing.tabsLabel,
  };
}

function hasCopy(listing: BlogListing) {
  return [
    listing.heading,
    listing.allLabel,
    listing.countSuffix,
    listing.emptyMessage,
    listing.featuredLabel,
    listing.readLabel,
    listing.readSuffix,
    listing.tabsLabel,
  ].some((value) => value.trim());
}

export async function getBlogListing(): Promise<BlogListing> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/listing");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the listing."));
  }
  const body = (await response.json()) as ApiListing;
  return toListing(body, body.is_active !== false);
}

export async function saveBlogListing(listing: BlogListing): Promise<BlogListing> {
  const response = await authorizedFetch("/api/v1/admin/pages/blogs/listing", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(listing)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the listing."));
  }
  const body = (await response.json()) as ApiListing;
  return toListing(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicBlogListing(): Promise<BlogListing | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/blogs/listing`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const listing = toListing((await response.json()) as ApiListing, true);
    if (!hasCopy(listing)) return { ...listing, isActive: false };
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
  if (response.status === 401) return "Sign in again to edit the blog page.";
  return fallback;
}
