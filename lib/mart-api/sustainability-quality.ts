import {
  MartApiError,
  authorizedFetch,
  fileFromSrc,
  isLocalImage,
  mediaUrl,
  sitePath,
} from "@/lib/mart-api/products";
import { IMPACT_ICONS } from "@/lib/mart-api/sustainability-impact";

export type SustainabilityQualityStep = {
  id: string;
  text: string;
  isActive: boolean;
};

export type SustainabilityQualityBadge = {
  id: string;
  icon: string;
  label: string;
  isActive: boolean;
};

export type SustainabilityQuality = {
  title: string;
  body: string;
  image: { src: string; alt: string };
  steps: SustainabilityQualityStep[];
  badges: SustainabilityQualityBadge[];
};

type ApiStep = { id: string; text: string; is_active?: boolean };
type ApiBadge = {
  id: string;
  icon: string;
  label: string;
  is_active?: boolean;
};
type ApiQuality = {
  title: string;
  body: string;
  image: { src: string; alt: string };
  steps?: ApiStep[];
  badges?: ApiBadge[];
};

const ICONS = new Set<string>(IMPACT_ICONS);
const PHOTO = "/images/products/lamp/lamp-3.jpg";

export const FALLBACK_SUSTAINABILITY_QUALITY: SustainabilityQuality = {
  title: "কোয়ালিটি নিশ্চয়তা প্রক্রিয়া",
  body: "প্রোডাক্ট আপনার কাছে পৌঁছানোর আগে আমরা নিজে যাচাই করি — গ্যাজেট চালিয়ে টেস্ট, ড্রেসের সেলাই ও ফেব্রিক আলাদা করে চেক। যা অর্ডার করছেন, তা-ই হাতে পাবেন।",
  image: { src: PHOTO, alt: "সানসেট ল্যাম্প — কোয়ালিটি টেস্টেড প্রোডাক্ট" },
  steps: [
    {
      id: "step-1",
      text: "গ্যাজেট চালিয়ে ও ড্রেসের ফিনিশিং দেখে পরীক্ষা",
      isActive: true,
    },
    { id: "step-2", text: "নিরাপদে প্যাক করে পাঠানো", isActive: true },
    {
      id: "step-3",
      text: "হাতে পেয়ে দেখে তারপর পেমেন্ট (COD)",
      isActive: true,
    },
  ],
  badges: [
    {
      id: "badge-1",
      icon: "check_circle",
      label: "চেক করে পাঠাই",
      isActive: true,
    },
    {
      id: "badge-2",
      icon: "payments",
      label: "ক্যাশ অন ডেলিভারি",
      isActive: true,
    },
  ],
};

export function qualityIcon(icon: string) {
  return ICONS.has(icon) ? icon : "check_circle";
}

function toQuality(body: ApiQuality): SustainabilityQuality {
  return {
    title: body.title,
    body: body.body,
    image: { src: mediaUrl(body.image.src), alt: body.image.alt },
    steps: (body.steps ?? []).map((step) => ({
      id: step.id,
      text: step.text,
      isActive: step.is_active !== false,
    })),
    badges: (body.badges ?? []).map((badge) => ({
      id: badge.id,
      icon: qualityIcon(badge.icon),
      label: badge.label,
      isActive: badge.is_active !== false,
    })),
  };
}

async function toForm(quality: SustainabilityQuality) {
  const body = new FormData();
  body.set(
    "payload",
    JSON.stringify({
      title: quality.title,
      body: quality.body,
      image: {
        alt: quality.image.alt,
        src: isLocalImage(quality.image.src) ? "" : sitePath(quality.image.src),
      },
      steps: quality.steps.map((step) => ({
        text: step.text,
        is_active: step.isActive,
      })),
      badges: quality.badges.map((badge) => ({
        icon: badge.icon || "check_circle",
        label: badge.label,
        is_active: badge.isActive,
      })),
    }),
  );
  if (isLocalImage(quality.image.src)) {
    body.set("image_0", await fileFromSrc(quality.image.src, "quality"));
  }
  return body;
}

export async function getSustainabilityQuality(): Promise<SustainabilityQuality> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/quality",
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not load the quality section."),
    );
  }
  return toQuality((await response.json()) as ApiQuality);
}

export async function saveSustainabilityQuality(
  quality: SustainabilityQuality,
): Promise<SustainabilityQuality> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/quality",
    {
      method: "PUT",
      body: await toForm(quality),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the quality section."),
    );
  }
  return toQuality((await response.json()) as ApiQuality);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicSustainabilityQuality(): Promise<SustainabilityQuality | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/sustainability/quality`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return toQuality((await response.json()) as ApiQuality);
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
  if (response.status === 401)
    return "Sign in again to edit the sustainability page.";
  return fallback;
}
