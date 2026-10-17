import {
  appendSingleImage,
  readSingleImage,
  type SingleImage,
} from "@/lib/mart-api/about-single-image";
import {
  MartApiError,
  authorizedFetch,
} from "@/lib/mart-api/products";

export type AboutStoryParagraph = {
  id: string;
  text: string;
};

export type AboutStoryImage = SingleImage;

export type AboutStory = {
  id: string;
  kicker: string;
  title: string;
  paragraphs: AboutStoryParagraph[];
  cta: { label: string; href: string };
  /** The one photo beside the story. */
  image: AboutStoryImage | null;
  isActive: boolean;
};

type ApiParagraph = { id: string; text: string };
type ApiImage = { id: string; src: string; alt: string };
type ApiStory = {
  id: string;
  kicker: string;
  title: string;
  paragraphs: ApiParagraph[];
  cta_label: string;
  cta_href: string;
  is_active?: boolean;
  image?: ApiImage | null;
  images?: ApiImage[];
};

const LAMP = "/images/products/lamp/lamp-2.jpg";

export const FALLBACK_ABOUT_STORIES: AboutStory[] = [
  {
    id: "story-1",
    kicker: "আমাদের যাত্রা",
    title: "কেন ইমপ্লেসিয়া মার্ট শুরু হলো",
    paragraphs: [
      {
        id: "story-1",
        text: "অনলাইনে অর্ডার করা মানেই ছিল একরাশ দুশ্চিন্তা — প্রোডাক্ট আসল কিনা, কোয়ালিটি ঠিক থাকবে কিনা, আগে টাকা দিয়ে ঠকে যাব কিনা। আমরা লক্ষ্য করলাম, সমস্যাটা প্রোডাক্টে নয়, বিশ্বাসে।",
      },
      {
        id: "story-2",
        text: "তাই ইমপ্লেসিয়া মার্টে প্রতিটি প্রোডাক্ট অর্ডারের আগে নিজেরা চালিয়ে দেখি, যাচাই করি, এবং সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা রাখি — যাতে আপনি প্রোডাক্ট হাতে পেয়ে, নিজে দেখে তারপর টাকা দিতে পারেন।",
      },
      {
        id: "story-3",
        text: "শুরুটা হয়েছিল হাতে গোনা কিছু ট্রেন্ডিং গ্যাজেট নিয়ে, কিন্তু আমাদের লক্ষ্য তার চেয়ে অনেক বড় — প্রতিদিনের প্রয়োজনীয় থেকে শুরু করে জনপ্রিয় নানা ক্যাটাগরির প্রোডাক্ট, একই বিশ্বাসযোগ্যতা আর কোয়ালিটি স্ট্যান্ডার্ড মেনে, ধাপে ধাপে আপনার দরজায় পৌঁছে দেওয়াই আমাদের আসল লক্ষ্য।",
      },
    ],
    cta: { label: "সব প্রোডাক্ট", href: "/products" },
    image: { id: "story-image-1", src: LAMP, alt: "সানসেট ল্যাম্প — কোয়ালিটি চেক করা গ্যাজেট" },
    isActive: true,
  },
];

export function blankAboutStory(): AboutStory {
  return {
    id: "new",
    kicker: "",
    title: "",
    paragraphs: [{ id: "paragraph-1", text: "" }],
    cta: { label: "", href: "" },
    image: null,
    isActive: true,
  };
}

function toStory(body: ApiStory): AboutStory {
  return {
    id: body.id,
    kicker: body.kicker,
    title: body.title,
    paragraphs: body.paragraphs.map((item) => ({ id: item.id, text: item.text })),
    cta: { label: body.cta_label, href: body.cta_href },
    image: readSingleImage(body),
    isActive: body.is_active !== false,
  };
}

async function toForm(story: AboutStory) {
  const body = new FormData();
  await appendSingleImage(
    body,
    {
      kicker: story.kicker,
      title: story.title,
      paragraphs: story.paragraphs
        .map((item) => ({ text: item.text.trim() }))
        .filter((item) => item.text),
      cta_label: story.cta.label,
      cta_href: story.cta.href,
      is_active: story.isActive,
    },
    story.image,
    "story-photo",
  );
  return body;
}

export async function listAboutStories(): Promise<AboutStory[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/stories");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the stories."));
  }
  const body = (await response.json()) as ApiStory[];
  return body.map(toStory);
}

export async function createAboutStory(story: AboutStory): Promise<AboutStory> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/stories", {
    method: "POST",
    body: await toForm(story),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the story."));
  }
  return toStory((await response.json()) as ApiStory);
}

export async function updateAboutStory(id: string, story: AboutStory): Promise<AboutStory> {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/stories/${id}`, {
    method: "PATCH",
    body: await toForm(story),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the story."));
  }
  return toStory((await response.json()) as ApiStory);
}

export async function deleteAboutStory(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/stories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the story."));
  }
}

export async function reorderAboutStories(ids: string[]): Promise<AboutStory[]> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/stories/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the stories."));
  }
  const body = (await response.json()) as ApiStory[];
  return body.map(toStory);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicAboutStories(): Promise<AboutStory[] | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/about/stories`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { items?: ApiStory[] };
    return (body.items ?? []).map(toStory);
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
