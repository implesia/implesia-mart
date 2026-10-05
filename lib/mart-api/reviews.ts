import {
  MartApiError,
  authorizedFetch,
  fileFromSrc,
  isLocalImage,
  mediaUrl,
  sitePath,
} from "@/lib/mart-api/products";

export type ReviewChannel = "WhatsApp" | "Messenger";

export type ReviewItem = {
  id: string;
  product: string;
  channel: ReviewChannel;
  imageSrc: string;
  imageAlt: string;
  isActive: boolean;
};

export type ReviewDraft = {
  product: string;
  channel: ReviewChannel;
  imageSrc: string;
  imageAlt: string;
  isActive: boolean;
};

export type ReviewSection = {
  kicker: string;
  title: string;
  subtitle: string;
  items: ReviewItem[];
};

export type ReviewPublicItem = {
  id: string;
  product: string;
  channel: ReviewChannel;
  imageSrc: string;
  imageAlt: string;
};

export type ReviewPublic = {
  kicker: string;
  title: string;
  subtitle: string;
  items: ReviewPublicItem[];
};

type ApiItem = {
  id: string;
  product: string;
  channel: ReviewChannel;
  image_src: string;
  image_alt: string;
  is_active?: boolean;
};

type ApiSection = {
  kicker: string;
  title: string;
  subtitle: string;
  items: ApiItem[];
};

export const FALLBACK_REVIEWS: ReviewPublic = {
  kicker: "রিভিউ",
  title: "কাস্টমাররা যা বলছেন",
  subtitle: "হোয়াটসঅ্যাপ ও মেসেঞ্জারের রিভিউ স্ক্রিনশট। ছবিতে ক্লিক করলে পুরো কথোপকথন খোলে।",
  items: [
    {
      id: "sunset-lamp-1",
      product: "সানসেট ল্যাম্প",
      channel: "WhatsApp",
      imageSrc: "/images/reviews/sunset-lamp-1.jpg",
      imageAlt: "সানসেট ল্যাম্পের কাস্টমার রিভিউ স্ক্রিনশট",
    },
    {
      id: "phone-holder-1",
      product: "AI ফোন হোল্ডার",
      channel: "Messenger",
      imageSrc: "/images/reviews/phone-holder-1.jpg",
      imageAlt: "এআই ফোন হোল্ডারের কাস্টমার রিভিউ স্ক্রিনশট",
    },
    {
      id: "gown-1",
      product: "কাস্টম গাউন",
      channel: "WhatsApp",
      imageSrc: "/images/reviews/gown-1.jpg",
      imageAlt: "কাস্টম গাউনের কাস্টমার রিভিউ স্ক্রিনশট",
    },
    {
      id: "phone-holder-2",
      product: "AI ফোন হোল্ডার",
      channel: "WhatsApp",
      imageSrc: "/images/reviews/phone-holder-2.jpg",
      imageAlt: "এআই ফোন হোল্ডারের আরেকটি কাস্টমার রিভিউ স্ক্রিনশট",
    },
    {
      id: "sunset-lamp-2",
      product: "সানসেট ল্যাম্প",
      channel: "Messenger",
      imageSrc: "/images/reviews/sunset-lamp-2.jpg",
      imageAlt: "সানসেট ল্যাম্পের আরেকটি কাস্টমার রিভিউ স্ক্রিনশট",
    },
    {
      id: "baby-frock-1",
      product: "বেবি পার্টি ফ্রক",
      channel: "WhatsApp",
      imageSrc: "/images/reviews/baby-frock-1.jpg",
      imageAlt: "বেবি পার্টি ফ্রকের কাস্টমার রিভিউ স্ক্রিনশট",
    },
  ],
};

export function blankReviewDraft(): ReviewDraft {
  return { product: "", channel: "WhatsApp", imageSrc: "", imageAlt: "", isActive: true };
}

export function reviewImage(src: string) {
  return mediaUrl(src);
}

function toItem(body: ApiItem): ReviewItem {
  return {
    id: body.id,
    product: body.product,
    channel: body.channel,
    imageSrc: body.image_src,
    imageAlt: body.image_alt,
    isActive: body.is_active !== false,
  };
}

function toSection(body: ApiSection): ReviewSection {
  return {
    kicker: body.kicker,
    title: body.title,
    subtitle: body.subtitle,
    items: body.items.map(toItem),
  };
}

async function itemForm(draft: ReviewDraft) {
  const local = isLocalImage(draft.imageSrc);
  const body = new FormData();
  body.set(
    "payload",
    JSON.stringify({
      product: draft.product,
      channel: draft.channel,
      image_src: local ? "" : sitePath(draft.imageSrc),
      image_alt: draft.imageAlt,
      is_active: draft.isActive,
    }),
  );
  if (local) body.set("image", await fileFromSrc(draft.imageSrc, "review"));
  return body;
}

export async function getReviewSection(): Promise<ReviewSection> {
  const response = await authorizedFetch("/api/v1/admin/home/reviews");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the reviews."));
  }
  return toSection((await response.json()) as ApiSection);
}

export async function updateReviewCopy(copy: {
  kicker: string;
  title: string;
  subtitle: string;
}): Promise<ReviewSection> {
  const response = await authorizedFetch("/api/v1/admin/home/reviews", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(copy),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the heading."));
  }
  return toSection((await response.json()) as ApiSection);
}

export async function createReviewItem(draft: ReviewDraft): Promise<ReviewItem> {
  const response = await authorizedFetch("/api/v1/admin/home/reviews/items", {
    method: "POST",
    body: await itemForm(draft),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the review."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function updateReviewItem(id: string, draft: ReviewDraft): Promise<ReviewItem> {
  const response = await authorizedFetch(`/api/v1/admin/home/reviews/items/${id}`, {
    method: "PATCH",
    body: await itemForm(draft),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the review."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function deleteReviewItem(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/home/reviews/items/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the review."));
  }
}

export async function reorderReviewItems(ids: string[]): Promise<ReviewSection> {
  const response = await authorizedFetch("/api/v1/admin/home/reviews/items/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the reviews."));
  }
  return toSection((await response.json()) as ApiSection);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicReviews(): Promise<ReviewPublic | null> {
  try {
    const response = await fetch(`${API}/api/v1/home/reviews`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiSection;
    return {
      kicker: body.kicker,
      title: body.title,
      subtitle: body.subtitle,
      items: (body.items ?? []).map((item) => ({
        id: item.id,
        product: item.product,
        channel: item.channel,
        imageSrc: reviewImage(item.image_src),
        imageAlt: item.image_alt,
      })),
    };
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
  if (response.status === 401) return "Sign in again to edit reviews.";
  return fallback;
}
