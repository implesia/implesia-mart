import { getWhatsAppHref } from "@/app/(client)/_data/contact/contact";
import {
  appendSingleImage,
  readSingleImage,
  type SingleImage,
} from "@/lib/mart-api/about-single-image";
import {
  MartApiError,
  authorizedFetch,
} from "@/lib/mart-api/products";

export const DRESS_ICONS = [
  "design_services",
  "back_hand",
  "checkroom",
  "verified",
  "payments",
  "local_shipping",
  "assignment_return",
  "favorite",
  "storefront",
] as const;

export type AboutDressFeature = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type AboutDressImage = SingleImage;

export type AboutDress = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  features: AboutDressFeature[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  /** The one photo on the block (was a gallery before backend 0071). */
  image: AboutDressImage | null;
  isActive: boolean;
};

type ApiFeature = { id: string; icon: string; title: string; description: string };
type ApiImage = { id: string; src: string; alt: string };
type ApiDress = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  features: ApiFeature[];
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  is_active?: boolean;
  image?: ApiImage | null;
  images?: ApiImage[];
};

const ICONS = new Set<string>(DRESS_ICONS);

export function dressIcon(icon: string) {
  return ICONS.has(icon) ? icon : "design_services";
}

export const FALLBACK_ABOUT_DRESSES: AboutDress[] = [
  {
    id: "dress-1",
    kicker: "নতুন সংযোজন",
    title: "শুধু গ্যাজেট নয়, আমরা তৈরি করি গর্জিয়াস ড্রেসও",
    subtitle:
      "ট্রেন্ডিং গ্যাজেটের পাশাপাশি এখন আমরা হাতে তৈরি করছি বাচ্চাদের ও নারীদের জন্য অসাধারণ গর্জিয়াস ড্রেস। আপনার পছন্দের ডিজাইন, কালার ও মাপ জানালেই আমরা বানিয়ে দিব ঠিক আপনার মনের মতো — সেরা ফেব্রিক ও ফিনিশিং কোয়ালিটি বজায় রেখে।",
    features: [
      {
        id: "dress-feature-1",
        icon: "design_services",
        title: "কাস্টম ডিজাইন",
        description: "আপনার পছন্দের ডিজাইন, কালার ও মাপ অনুযায়ী তৈরি করি।",
      },
      {
        id: "dress-feature-2",
        icon: "back_hand",
        title: "১০০% হাতে তৈরি",
        description: "প্রতিটি ড্রেস তৈরি হয় নিজ হাতে, যত্ন ও নিষ্ঠার সাথে।",
      },
      {
        id: "dress-feature-3",
        icon: "checkroom",
        title: "বাচ্চা ও নারীদের জন্য",
        description: "শিশুদের পার্টি ড্রেস থেকে নারীদের গর্জিয়াস গাউন — সবই পাবেন।",
      },
      {
        id: "dress-feature-4",
        icon: "verified",
        title: "প্রিমিয়াম কোয়ালিটি",
        description: "উন্নত ফেব্রিক আর নিখুঁত ফিনিশিং সবসময় আমাদের অগ্রাধিকার।",
      },
    ],
    primaryCta: {
      label: "কাস্টম অর্ডার",
      href: getWhatsAppHref("হ্যালো, আমি একটি কাস্টম ডিজাইনের ড্রেস অর্ডার করতে চাই।"),
    },
    secondaryCta: { label: "গর্জিয়াস ড্রেস", href: "/products?category=fashion" },
    image: {
      id: "dress-image-1",
      src: "/images/products/baby-products/baby-frock-with-baby.jpeg",
      alt: "হাতে তৈরি বেবি পার্টি ড্রেস — সরাসরি ব্যবহারের ছবি",
    },
    isActive: true,
  },
];

export function blankAboutDress(): AboutDress {
  return {
    id: "new",
    kicker: "",
    title: "",
    subtitle: "",
    features: [{ id: "feature-1", icon: "design_services", title: "", description: "" }],
    primaryCta: { label: "", href: "" },
    secondaryCta: { label: "", href: "" },
    image: null,
    isActive: true,
  };
}

function toDress(body: ApiDress): AboutDress {
  return {
    id: body.id,
    kicker: body.kicker,
    title: body.title,
    subtitle: body.subtitle,
    features: body.features.map((item) => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      description: item.description,
    })),
    primaryCta: { label: body.primary_label, href: body.primary_href },
    secondaryCta: { label: body.secondary_label, href: body.secondary_href },
    image: readSingleImage(body),
    isActive: body.is_active !== false,
  };
}

async function toForm(dress: AboutDress) {
  const body = new FormData();
  await appendSingleImage(
    body,
    {
      kicker: dress.kicker,
      title: dress.title,
      subtitle: dress.subtitle,
      features: dress.features
        .map((item) => ({
          icon: item.icon || "design_services",
          title: item.title.trim(),
          description: item.description.trim(),
        }))
        .filter((item) => item.title || item.description),
      primary_label: dress.primaryCta.label,
      primary_href: dress.primaryCta.href,
      secondary_label: dress.secondaryCta.label,
      secondary_href: dress.secondaryCta.href,
      is_active: dress.isActive,
    },
    dress.image,
    "dress-photo",
  );
  return body;
}

export async function listAboutDresses(): Promise<AboutDress[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/dresses");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the custom dresses."));
  }
  const body = (await response.json()) as ApiDress[];
  return body.map(toDress);
}

export async function createAboutDress(dress: AboutDress): Promise<AboutDress> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/dresses", {
    method: "POST",
    body: await toForm(dress),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the custom dress."));
  }
  return toDress((await response.json()) as ApiDress);
}

export async function updateAboutDress(id: string, dress: AboutDress): Promise<AboutDress> {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/dresses/${id}`, {
    method: "PATCH",
    body: await toForm(dress),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the custom dress."));
  }
  return toDress((await response.json()) as ApiDress);
}

export async function deleteAboutDress(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/dresses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the custom dress."));
  }
}

export async function reorderAboutDresses(ids: string[]): Promise<AboutDress[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/dresses/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the custom dresses."));
  }
  const body = (await response.json()) as ApiDress[];
  return body.map(toDress);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicAboutDresses(): Promise<AboutDress[] | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/about/dresses`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { items?: ApiDress[] };
    return (body.items ?? []).map((item) => {
      const dress = toDress(item);
      return {
        ...dress,
        features: dress.features.map((feature) => ({ ...feature, icon: dressIcon(feature.icon) })),
      };
    });
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
