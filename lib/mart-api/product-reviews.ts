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
