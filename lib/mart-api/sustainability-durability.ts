import {
  MartApiError,
  authorizedFetch,
  fileFromSrc,
  isLocalImage,
  mediaUrl,
  sitePath,
} from "@/lib/mart-api/products";

export type SustainabilityDurabilityBullet = {
  id: string;
  text: string;
  isActive: boolean;
};

export type SustainabilityDurability = {
  title: string;
  body: string;
  image: { src: string; alt: string };
  bullets: SustainabilityDurabilityBullet[];
};

type ApiBullet = { id: string; text: string; is_active?: boolean };
type ApiDurability = {
  title: string;
  body: string;
  image: { src: string; alt: string };
  bullets?: ApiBullet[];
};

const PHOTO = "/images/products/baby-products/3-quater-ground-frog.jpeg";

export const FALLBACK_SUSTAINABILITY_DURABILITY: SustainabilityDurability = {
  title: "দীর্ঘস্থায়ী প্রোডাক্ট, কম বর্জ্য",
  body: "শুধু ট্রেন্ডিং নয় — যেগুলো দীর্ঘদিন কাজে লাগে। ভালো গ্যাজেট মানে কম রিপ্লেসমেন্ট; হাতে তৈরি গর্জিয়াস ড্রেস মানে ফাস্ট ফ্যাশনের চেয়ে কম কাপড়-বর্জ্য।",
  image: { src: PHOTO, alt: "হাতে তৈরি গর্জিয়াস ড্রেস — টেকসই ফেব্রিক ও সেলাই" },
  bullets: [
    { id: "bullet-1", text: "মানসম্পন্ন ম্যাটেরিয়াল ও বিল্ড", isActive: true },
    {
      id: "bullet-2",
      text: "হাতে তৈরি ড্রেসে টেকসই ফেব্রিক ও সেলাই",
      isActive: true,
    },
    { id: "bullet-3", text: "কম রিপ্লেসমেন্ট, কম ই-বর্জ্য", isActive: true },
    { id: "bullet-4", text: "হাতে পেয়ে দেখে তারপর পেমেন্ট", isActive: true },
  ],
};

function toDurability(body: ApiDurability): SustainabilityDurability {
  return {
    title: body.title,
    body: body.body,
    image: { src: mediaUrl(body.image.src), alt: body.image.alt },
    bullets: (body.bullets ?? []).map((bullet) => ({
      id: bullet.id,
      text: bullet.text,
      isActive: bullet.is_active !== false,
    })),
  };
}

async function toForm(durability: SustainabilityDurability) {
  const body = new FormData();
  body.set(
    "payload",
    JSON.stringify({
      title: durability.title,
      body: durability.body,
      image: {
        alt: durability.image.alt,
        src: isLocalImage(durability.image.src) ? "" : sitePath(durability.image.src),
      },
      bullets: durability.bullets.map((bullet) => ({
        text: bullet.text,
        is_active: bullet.isActive,
      })),
    }),
  );
  if (isLocalImage(durability.image.src)) {
    body.set("image_0", await fileFromSrc(durability.image.src, "durability"));
  }
  return body;
}

export async function getSustainabilityDurability(): Promise<SustainabilityDurability> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/durability",
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not load the durability section."),
    );
  }
  return toDurability((await response.json()) as ApiDurability);
}

export async function saveSustainabilityDurability(
  durability: SustainabilityDurability,
): Promise<SustainabilityDurability> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/durability",
    {
      method: "PUT",
      body: await toForm(durability),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the durability section."),
    );
  }
  return toDurability((await response.json()) as ApiDurability);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicSustainabilityDurability(): Promise<SustainabilityDurability | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/sustainability/durability`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return toDurability((await response.json()) as ApiDurability);
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
