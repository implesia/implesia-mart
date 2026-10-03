import {
  MartApiError,
  authorizedFetch,
  fileFromSrc,
  isLocalImage,
  mediaUrl,
  sitePath,
} from "@/lib/mart-api/products";

export type SustainabilityOriginImage = {
  id: string;
  src: string;
  alt: string;
  isActive: boolean;
};

export type SustainabilityOrigin = {
  eyebrow: string;
  title: string;
  body: string;
  quote: string;
  images: SustainabilityOriginImage[];
};

type ApiImage = {
  id: string;
  src: string;
  alt: string;
  is_active?: boolean;
};

type ApiOrigin = {
  eyebrow: string;
  title: string;
  body: string;
  quote: string;
  images?: ApiImage[];
};

const LAMP = "/images/products/lamp/lamp-2.jpg";
const FROCK = "/images/products/baby-products/baby-frock-with-baby.jpeg";

export const FALLBACK_SUSTAINABILITY_ORIGIN: SustainabilityOrigin = {
  eyebrow: "আমাদের দৃষ্টিভঙ্গি",
  title: "কোয়ালিটি এখন বিলাসিতা নয়, দায়িত্ব",
  body: "ইমপ্লেসিয়া মার্ট শুরু হয়েছিল একটা সহজ প্রশ্ন থেকে — কেন ভালো প্রোডাক্ট মানেই বেশি ঝুঁকি হবে? প্রতিটি গ্যাজেট অর্ডারের আগে নিজেরা টেস্ট করি, আর প্রতিটি ড্রেস হাতে বানিয়ে চেক করে পাঠাই — যাতে প্রথমবারেই সঠিক জিনিস হাতে পান। কম রিটার্ন, কম বর্জ্য।",
  quote: "কোয়ালিটি একটি অভ্যাস, একবারের কাজ নয়।",
  images: [
    {
      id: "origin-1",
      src: LAMP,
      alt: "সানসেট ল্যাম্প — কোয়ালিটি চেক করা প্রোডাক্ট",
      isActive: true,
    },
    {
      id: "origin-2",
      src: FROCK,
      alt: "হাতে তৈরি বেবি পার্টি ফ্রক",
      isActive: true,
    },
  ],
};

function toOrigin(body: ApiOrigin): SustainabilityOrigin {
  return {
    eyebrow: body.eyebrow,
    title: body.title,
    body: body.body,
    quote: body.quote,
    images: (body.images ?? []).map((image) => ({
      id: image.id,
      src: mediaUrl(image.src),
      alt: image.alt,
      isActive: image.is_active !== false,
    })),
  };
}

async function toForm(origin: SustainabilityOrigin) {
  const body = new FormData();
  body.set(
    "payload",
    JSON.stringify({
      eyebrow: origin.eyebrow,
      title: origin.title,
      body: origin.body,
      quote: origin.quote,
      images: origin.images.map((image) => ({
        alt: image.alt,
        src: isLocalImage(image.src) ? "" : sitePath(image.src),
        is_active: image.isActive,
      })),
    }),
  );
  for (const [index, image] of origin.images.entries()) {
    if (!isLocalImage(image.src)) continue;
    body.set(
      `image_${index}`,
      await fileFromSrc(image.src, `origin-${index + 1}`),
    );
  }
  return body;
}

export async function getSustainabilityOrigin(): Promise<SustainabilityOrigin> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/origin",
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not load the point of view."),
    );
  }
  return toOrigin((await response.json()) as ApiOrigin);
}

export async function saveSustainabilityOrigin(
  origin: SustainabilityOrigin,
): Promise<SustainabilityOrigin> {
  const response = await authorizedFetch(
    "/api/v1/admin/pages/sustainability/origin",
    {
      method: "PUT",
      body: await toForm(origin),
    },
  );
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the point of view."),
    );
  }
  return toOrigin((await response.json()) as ApiOrigin);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicSustainabilityOrigin(): Promise<SustainabilityOrigin | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/sustainability/origin`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return toOrigin((await response.json()) as ApiOrigin);
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
