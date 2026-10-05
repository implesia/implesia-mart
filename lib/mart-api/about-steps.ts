import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export const STEP_ICONS = [
  "payments",
  "local_shipping",
  "assignment_return",
  "verified",
  "category",
  "location_on",
  "design_services",
  "back_hand",
  "checkroom",
  "visibility",
  "rocket_launch",
  "search",
  "task_alt",
  "storefront",
  "support_agent",
  "favorite",
  "shield",
] as const;

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export type AboutStep = {
  id: string;
  step: string;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type AboutStepDraft = {
  step: string;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
};

export type AboutSteps = {
  kicker: string;
  title: string;
  subtitle: string;
  items: AboutStep[];
};

type ApiItem = {
  id: string;
  step: string;
  icon: string;
  title: string;
  description: string;
  is_active?: boolean;
};

type ApiSteps = {
  kicker: string;
  title: string;
  subtitle: string;
  items?: ApiItem[];
};

const ICONS = new Set<string>(STEP_ICONS);

export const FALLBACK_ABOUT_STEPS: AboutSteps = {
  kicker: "সহজ প্রক্রিয়া",
  title: "কীভাবে অর্ডার করবেন",
  subtitle: "চার ধাপে অর্ডার — হাতে পেয়ে তারপর পেমেন্ট।",
  items: [
    {
      id: "pick",
      step: "০১",
      icon: "search",
      title: "প্রোডাক্ট বাছাই করুন",
      description: "পছন্দের প্রোডাক্ট খুঁজে নিন এবং কার্টে যুক্ত করুন।",
      isActive: true,
    },
    {
      id: "confirm",
      step: "০২",
      icon: "task_alt",
      title: "অর্ডার কনফার্ম করুন",
      description: "নাম, ঠিকানা ও ফোন নাম্বার দিয়ে অর্ডার কনফার্ম করুন।",
      isActive: true,
    },
    {
      id: "deliver",
      step: "০৩",
      icon: "local_shipping",
      title: "সারাদেশে ডেলিভারি",
      description: "ঢাকা থেকে দূরের জেলা — অর্ডার আপনার ঠিকানায় পৌঁছে যাবে।",
      isActive: true,
    },
    {
      id: "pay",
      step: "০৪",
      icon: "payments",
      title: "হাতে পেয়ে পেমেন্ট",
      description: "প্রোডাক্ট দেখে, যাচাই করে তারপর ক্যাশ পেমেন্ট করুন।",
      isActive: true,
    },
  ],
};

export function nextStepNumber(count: number) {
  return String(count + 1)
    .padStart(2, "0")
    .replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

export function blankAboutStep(count: number): AboutStepDraft {
  return {
    step: nextStepNumber(count),
    icon: "task_alt",
    title: "",
    description: "",
    isActive: true,
  };
}

export function stepIcon(icon: string) {
  return ICONS.has(icon) ? icon : "task_alt";
}

function toItem(body: ApiItem): AboutStep {
  return {
    id: body.id,
    step: body.step,
    icon: body.icon,
    title: body.title,
    description: body.description,
    isActive: body.is_active !== false,
  };
}

function toSection(body: ApiSteps): AboutSteps {
  return {
    kicker: body.kicker,
    title: body.title,
    subtitle: body.subtitle,
    items: (body.items ?? []).map(toItem),
  };
}

function toBody(draft: AboutStepDraft) {
  return {
    step: draft.step,
    icon: draft.icon,
    title: draft.title,
    description: draft.description,
    is_active: draft.isActive,
  };
}

export async function listAboutSteps(): Promise<AboutSteps> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/steps");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the steps."));
  }
  return toSection((await response.json()) as ApiSteps);
}

export async function updateAboutStepsCopy(copy: {
  kicker: string;
  title: string;
  subtitle: string;
}): Promise<AboutSteps> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/steps", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(copy),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the heading."));
  }
  return toSection((await response.json()) as ApiSteps);
}

export async function createAboutStep(draft: AboutStepDraft): Promise<AboutStep> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/steps/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the step."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function updateAboutStep(id: string, draft: AboutStepDraft): Promise<AboutStep> {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/steps/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(draft)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the step."));
  }
  return toItem((await response.json()) as ApiItem);
}

export async function deleteAboutStep(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/pages/about/steps/items/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the step."));
  }
}

export async function reorderAboutSteps(ids: string[]): Promise<AboutSteps> {
  const response = await authorizedFetch("/api/v1/admin/pages/about/steps/items/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the steps."));
  }
  return toSection((await response.json()) as ApiSteps);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicAboutSteps(): Promise<AboutSteps | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/about/steps`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const section = toSection((await response.json()) as ApiSteps);
    return {
      ...section,
      items: section.items.map((item) => ({ ...item, icon: stepIcon(item.icon) })),
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
  if (response.status === 401) return "Sign in again to edit the about page.";
  return fallback;
}
