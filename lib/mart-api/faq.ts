import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  isActive: boolean;
};

export type FaqDraft = {
  category: string;
  question: string;
  answer: string;
  isActive: boolean;
};

export type FaqSection = {
  kicker: string;
  title: string;
  subtitle: string;
  moreLabel: string;
  moreHref: string;
  items: FaqItem[];
};

export type FaqPublicItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export type FaqPublic = {
  kicker: string;
  title: string;
  subtitle: string;
  moreLabel: string;
  moreHref: string;
  items: FaqPublicItem[];
};

type ApiItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_active?: boolean;
};

type ApiSection = {
  kicker: string;
  title: string;
  subtitle: string;
  more_label: string;
  more_href: string;
  items: ApiItem[];
};

export const FALLBACK_FAQ: FaqPublic = {
  kicker: "জিজ্ঞাসা ও উত্তর",
  title: "প্রায়শই জিজ্ঞাসিত প্রশ্ন",
  subtitle:
    "অর্ডার, পেমেন্ট, ডেলিভারি ও রিটার্ন নিয়ে সাধারণ প্রশ্নের দ্রুত উত্তর।",
  moreLabel: "আরও প্রশ্ন দেখুন",
  moreHref: "/faqs",
  items: [
    {
      id: "faq-1",
      category: "অর্ডার ট্র্যাকিং",
      question: "আমার অর্ডার কীভাবে ট্র্যাক করব?",
      answer:
        "আমার অর্ডার পেজে অর্ডার নম্বর আর চেকআউটের মোবাইল দিলে স্ট্যাটাস দেখা যায়। একই ব্রাউজারে করলে নম্বর সেভ থাকে। দরকার হলে কল বা হোয়াটসঅ্যাপেও জানানো হয়।",
    },
    {
      id: "faq-2",
      category: "পেমেন্ট ও ক্যাশ অন ডেলিভারি",
      question: "অর্ডারের জন্য কি আগে টাকা পরিশোধ করতে হবে?",
      answer:
        "না। আমরা পুরো বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা দিচ্ছি — প্রোডাক্ট হাতে পেয়ে, ভালোভাবে দেখে তারপর টাকা পরিশোধ করতে পারবেন।",
    },
    {
      id: "faq-3",
      category: "রিটার্ন ও রিপ্লেসমেন্ট",
      question: "প্রোডাক্ট পছন্দ না হলে রিটার্ন করা যাবে?",
      answer:
        "হ্যাঁ। প্রোডাক্ট ড্যামেজ বা ভুল হলে ডেলিভারির ৩ দিনের মধ্যে জানালে আমরা রিটার্ন বা রিপ্লেসমেন্ট প্রক্রিয়া সম্পন্ন করে দিই।",
    },
    {
      id: "faq-4",
      category: "কাস্টমার সাপোর্ট",
      question: "কোনো সমস্যা হলে কীভাবে যোগাযোগ করব?",
      answer:
        "আমাদের কাস্টমার সাপোর্ট টিম ফোন, ফেসবুক পেজ ও ওয়েবসাইটের যোগাযোগ ফর্মের মাধ্যমে সবসময় সাহায্যের জন্য প্রস্তুত। আমরা দ্রুততম সময়ে উত্তর দেওয়ার চেষ্টা করি।",
    },
    {
      id: "faq-5",
      category: "প্রোডাক্ট কোয়ালিটি",
      question: "প্রোডাক্টগুলো কি কোয়ালিটি চেক করা হয়?",
      answer:
        "হ্যাঁ। ডেলিভারির আগে প্রতিটি প্রোডাক্ট চালু করে পরীক্ষা করা হয়, যাতে আপনার হাতে পৌঁছায় সম্পূর্ণ কার্যকর একটি প্রোডাক্ট।",
    },
    {
      id: "faq-6",
      category: "ডেলিভারি সময়",
      question: "ডেলিভারি পেতে কত সময় লাগে?",
      answer:
        "ঢাকার ভেতরে সাধারণত ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ২৪-৭২ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।",
    },
  ],
};

export function blankFaqDraft(): FaqDraft {
  return { category: "", question: "", answer: "", isActive: true };
}

function toItem(body: ApiItem): FaqItem {
  return {
    id: body.id,
    category: body.category,
    question: body.question,
    answer: body.answer,
    isActive: body.is_active !== false,
  };
}

function toSection(body: ApiSection): FaqSection {
  return {
    kicker: body.kicker,
    title: body.title,
    subtitle: body.subtitle,
    moreLabel: body.more_label,
    moreHref: body.more_href,
    items: body.items.map(toItem),
  };
}

export async function getFaqSection(): Promise<FaqSection> {
  const response = await authorizedFetch("/api/v1/admin/home/faq");
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not load the questions."),
    );
  }
  return toSection((await response.json()) as ApiSection);
}

export async function updateFaqCopy(copy: {
  kicker: string;
  title: string;
  subtitle: string;
  moreLabel: string;
  moreHref: string;
}): Promise<FaqSection> {
  const response = await authorizedFetch("/api/v1/admin/home/faq", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kicker: copy.kicker,
      title: copy.title,
      subtitle: copy.subtitle,
      more_label: copy.moreLabel,
      more_href: copy.moreHref,
    }),
  });
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the heading."),
    );
  }
  return toSection((await response.json()) as ApiSection);
}

export async function createFaqItem(draft: FaqDraft): Promise<FaqItem> {
  const response = await authorizedFetch("/api/v1/admin/home/faq/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: draft.category,
      question: draft.question,
      answer: draft.answer,
      is_active: draft.isActive,
    }),
  });
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the question."),
    );
  }
  return toItem((await response.json()) as ApiItem);
}

export async function updateFaqItem(
  id: string,
  draft: FaqDraft,
): Promise<FaqItem> {
  const response = await authorizedFetch(`/api/v1/admin/home/faq/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: draft.category,
      question: draft.question,
      answer: draft.answer,
      is_active: draft.isActive,
    }),
  });
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the question."),
    );
  }
  return toItem((await response.json()) as ApiItem);
}

export async function deleteFaqItem(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/home/faq/items/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not remove the question."),
    );
  }
}

export async function reorderFaqItems(ids: string[]): Promise<FaqSection> {
  const response = await authorizedFetch("/api/v1/admin/home/faq/items/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not reorder the questions."),
    );
  }
  return toSection((await response.json()) as ApiSection);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicFaq(): Promise<FaqPublic | null> {
  try {
    const response = await fetch(`${API}/api/v1/home/faq`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiSection;
    const section = toSection(body);
    return {
      kicker: section.kicker,
      title: section.title,
      subtitle: section.subtitle,
      moreLabel: section.moreLabel,
      moreHref: section.moreHref,
      items: section.items.map(({ id, category, question, answer }) => ({
        id,
        category,
        question,
        answer,
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
  if (response.status === 401) return "Sign in again to edit questions.";
  return fallback;
}
