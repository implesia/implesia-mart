import {
  appendSingleImage,
  readSingleImage,
  type SingleImage,
} from "@/lib/mart-api/about-single-image";
import {
  MartApiError,
  authorizedFetch,
} from "@/lib/mart-api/products";

export type SustainabilityHeroImage = SingleImage;

export type SustainabilityHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  /** Optional single photo; null renders the text-only hero. */
  image: SustainabilityHeroImage | null;
};

type ApiImage = {
  id: string;
  src: string;
  alt: string;
  sort_order?: number;
};

type ApiHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  image?: ApiImage | null;
  /** Legacy 0/1-item mirror (older APIs sent two photos). */
  images?: ApiImage[];
};

const LEFT = "/images/products/lamp/lamp-1.jpg";

export const FALLBACK_SUSTAINABILITY_HERO: SustainabilityHero = {
  eyebrow: "সাসটেইনেবিলিটি",
  title: "দায়িত্বশীল শপিং, দীর্ঘস্থায়ী প্রোডাক্ট",
  subtitle:
    "ভালো প্রোডাক্ট মানেই কম রিপ্লেসমেন্ট, কম বর্জ্য। গ্যাজেট যাচাই করে আর গর্জিয়াস ড্রেস হাতে তৈরি করে — দায়িত্বশীল প্যাকেজিংয়ে পাঠাই।",
  primaryLabel: "সব প্রোডাক্ট",
  primaryHref: "/products",
  secondaryLabel: "আমাদের সম্পর্কে",
  secondaryHref: "/about-us",
  image: { id: "hero-1", src: LEFT, alt: "সানসেট ল্যাম্প — কোয়ালিটি চেক করা গ্যাজেট" },
};

function toHero(body: ApiHero): SustainabilityHero {
  return {
    eyebrow: body.eyebrow,
    title: body.title,
    subtitle: body.subtitle,
    primaryLabel: body.primary_label,
    primaryHref: body.primary_href,
    secondaryLabel: body.secondary_label,
    secondaryHref: body.secondary_href,
    image: readSingleImage(body),
  };
}

export async function getSustainabilityHero(): Promise<SustainabilityHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/sustainability/hero");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the sustainability hero."));
  }
  return toHero((await response.json()) as ApiHero);
}

export async function saveSustainabilityHero(hero: SustainabilityHero): Promise<SustainabilityHero> {
  const body = new FormData();
  await appendSingleImage(
    body,
    {
      eyebrow: hero.eyebrow,
      title: hero.title,
      subtitle: hero.subtitle,
      primary_label: hero.primaryLabel,
      primary_href: hero.primaryHref,
      secondary_label: hero.secondaryLabel,
      secondary_href: hero.secondaryHref,
    },
    hero.image,
    "sustainability-hero",
  );
  const response = await authorizedFetch("/api/v1/admin/pages/sustainability/hero", {
    method: "PUT",
    body,
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the sustainability hero."));
  }
  return toHero((await response.json()) as ApiHero);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicSustainabilityHero(): Promise<SustainabilityHero | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/sustainability/hero`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return toHero((await response.json()) as ApiHero);
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
  if (response.status === 401) return "Sign in again to edit the sustainability page.";
  return fallback;
}
