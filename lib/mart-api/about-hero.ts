import {
  MartApiError,
  authorizedFetch,
  fileFromSrc,
  isLocalImage,
  mediaUrl,
  sitePath,
} from "@/lib/mart-api/products";

export type AboutHeroImage = {
  id: string;
  src: string;
  alt: string;
};

export type AboutHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  images: AboutHeroImage[];
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
  images: ApiImage[];
};

const LEFT = "/images/products/lamp/lamp-1.jpg";
const RIGHT = "/images/products/baby-products/female-gorgious-ground-dress.jpeg";

export const FALLBACK_ABOUT_HERO: AboutHero = {
  eyebrow: "আমাদের সম্পর্কে",
  title: "আপনার নিশ্চিন্ত অনলাইন শপিং পার্টনার।",
  subtitle:
    "ঘরে বসে কোয়ালিটি চেক করা প্রোডাক্ট — ক্যাশ অন ডেলিভারিতে, কোনো আগাম ঝুঁকি ছাড়াই। ট্রেন্ডিং গ্যাজেট আর হাতে তৈরি গর্জিয়াস ড্রেস, একই বিশ্বাসে।",
  primaryLabel: "সব প্রোডাক্ট",
  primaryHref: "/products",
  secondaryLabel: "যোগাযোগ",
  secondaryHref: "/contact-us",
  images: [
    { id: "hero-1", src: LEFT, alt: "সানসেট ল্যাম্প — ইমপ্লেসিয়া মার্টের ট্রেন্ডিং গ্যাজেট" },
    { id: "hero-2", src: RIGHT, alt: "হাতে তৈরি গর্জিয়াস উইমেন্স গাউন" },
  ],
};

function toHero(body: ApiHero): AboutHero {
  return {
    eyebrow: body.eyebrow,
    title: body.title,
    subtitle: body.subtitle,
    primaryLabel: body.primary_label,
    primaryHref: body.primary_href,
    secondaryLabel: body.secondary_label,
    secondaryHref: body.secondary_href,
    images: body.images.map((image) => ({
      id: image.id,
      src: mediaUrl(image.src),
      alt: image.alt,
    })),
  };
}

export async function getAboutHero(): Promise<AboutHero> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/hero");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the about hero."));
  }
  return toHero((await response.json()) as ApiHero);
}

export async function saveAboutHero(hero: AboutHero): Promise<AboutHero> {
  const images = hero.images.slice(0, 2);
  const body = new FormData();
  body.set(
    "payload",
    JSON.stringify({
      eyebrow: hero.eyebrow,
      title: hero.title,
      subtitle: hero.subtitle,
      primary_label: hero.primaryLabel,
      primary_href: hero.primaryHref,
      secondary_label: hero.secondaryLabel,
      secondary_href: hero.secondaryHref,
      images: images.map((image) => ({
        alt: image.alt,
        src: isLocalImage(image.src) ? "" : sitePath(image.src),
      })),
    }),
  );
  for (const [index, image] of images.entries()) {
    if (!isLocalImage(image.src)) continue;
    body.set(`image_${index}`, await fileFromSrc(image.src, `hero-${index + 1}`));
  }
  const response = await authorizedFetch("/api/v1/admin/pages/about/hero", {
    method: "PUT",
    body,
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the about hero."));
  }
  return toHero((await response.json()) as ApiHero);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicAboutHero(): Promise<AboutHero | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/about/hero`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
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
  if (response.status === 401) return "Sign in again to edit the about page.";
  return fallback;
}
