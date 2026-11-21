import { mediaUrl } from "./media-url";
import { MartApiError, publicFetch } from "./products";

export type ProductReviewItem = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  headline: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
};

export type ProductReviewSummary = {
  averageRating: number;
  totalReviews: number;
  ratingHistogram: Record<string, number>;
};

export type ProductReviewPage = {
  items: ProductReviewItem[];
  summary: ProductReviewSummary;
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

export type CanReviewResult = {
  canReview: boolean;
  reason: string;
  orderId: string | null;
};

export type ProductReviewCreateInput = {
  rating: number;
  headline?: string;
  comment?: string;
};

export type RatingBreakdownRow = {
  stars: 5 | 4 | 3 | 2 | 1;
  count: number;
  percent: number;
};

export const REVIEW_RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "খুবই খারাপ",
  2: "খারাপ",
  3: "মোটামুটি",
  4: "ভালো",
  5: "অসাধারণ!",
};

const STAR_LEVELS: readonly (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];

export function buildRatingBreakdown(
  summary: ProductReviewSummary | null | undefined,
): RatingBreakdownRow[] {
  const total = summary?.totalReviews ?? 0;
  const histogram = summary?.ratingHistogram ?? {};
  return STAR_LEVELS.map((stars) => {
    const rawCount = Number(histogram[String(stars)] ?? 0);
    const count = Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { stars, count, percent };
  });
}

export function validateReviewInput(input: {
  rating: number;
  headline: string;
  comment: string;
}): { ok: true } | { ok: false; error: string } {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "অনুগ্রহ করে ১ থেকে ৫ এর মধ্যে স্টার রেটিং নির্বাচন করুন।" };
  }
  const headline = input.headline.trim();
  const comment = input.comment.trim();
  if (headline.length > 160) {
    return { ok: false, error: "শিরোনাম সর্বোচ্চ ১৬০ অক্ষরের মধ্যে হতে হবে।" };
  }
  if (!comment) {
    return { ok: false, error: "অনুগ্রহ করে পণ্যটি সম্পর্কে আপনার মতামত লিখুন।" };
  }
  if (comment.length > 2000) {
    return { ok: false, error: "মতামত সর্বোচ্চ ২০০০ অক্ষরের মধ্যে হতে হবে।" };
  }
  return { ok: true };
}

export function formatReviewDateBn(iso?: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function buildReviewLoginHref(slug: string): string {
  const safeSlug = encodeURIComponent(slug.trim());
  const nextPath = `/products/${safeSlug}?tab=reviews`;
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function resolveInitialProductTab(
  tabParam: string | null | undefined,
  hash?: string | null,
  hasFaqs = false,
): "details" | "specifications" | "faq" | "reviews" {
  const normalizedTab = tabParam?.trim().toLowerCase();
  const normalizedHash = hash?.trim().toLowerCase();
  if (normalizedTab === "reviews" || normalizedHash === "#reviews") {
    return "reviews";
  }
  if (normalizedTab === "specifications") {
    return "specifications";
  }
  if (normalizedTab === "faq" && hasFaqs) {
    return "faq";
  }
  return "details";
}

type RawProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  rating: number;
  headline: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
};

function mapReview(raw: RawProductReview): ProductReviewItem {
  return {
    id: raw.id,
    productId: raw.product_id,
    userId: raw.user_id,
    userName: raw.user_name,
    userAvatar: raw.user_avatar ? mediaUrl(raw.user_avatar) || null : null,
    rating: raw.rating,
    headline: raw.headline,
    comment: raw.comment,
    isVerifiedPurchase: raw.is_verified_purchase,
    createdAt: raw.created_at,
  };
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>;
      error?: { message?: string };
      message?: string;
    };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function getProductReviews(
  productId: string,
  params?: { page?: number; pageSize?: number },
): Promise<ProductReviewPage> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));
  const qs = query.toString();

  const res = await publicFetch(
    `/api/v1/products/${encodeURIComponent(productId)}/reviews${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not load product reviews."));
  }
  const raw = (await res.json()) as {
    items: RawProductReview[];
    summary: {
      average_rating: number;
      total_reviews: number;
      rating_histogram: Record<string, number>;
    };
    total: number;
    page: number;
    page_size: number;
    pages: number;
  };
  return {
    items: raw.items.map(mapReview),
    summary: {
      averageRating: raw.summary.average_rating,
      totalReviews: raw.summary.total_reviews,
      ratingHistogram: raw.summary.rating_histogram,
    },
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
    pages: raw.pages,
  };
}

export async function getCanReviewProduct(
  productId: string,
): Promise<CanReviewResult> {
  const res = await fetch(
    `/api/customer/products/${encodeURIComponent(productId)}/can-review`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not check review eligibility."));
  }
  const raw = (await res.json()) as {
    can_review: boolean;
    reason: string;
    order_id: string | null;
  };
  return {
    canReview: raw.can_review,
    reason: raw.reason,
    orderId: raw.order_id,
  };
}

export async function submitProductReview(
  productId: string,
  input: ProductReviewCreateInput,
): Promise<ProductReviewItem> {
  const res = await fetch(
    `/api/customer/products/${encodeURIComponent(productId)}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        rating: input.rating,
        headline: input.headline ?? "",
        comment: input.comment ?? "",
      }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new MartApiError(await readError(res, "Could not submit product review."));
  }
  return mapReview((await res.json()) as RawProductReview);
}
