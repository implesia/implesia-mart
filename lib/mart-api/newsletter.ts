import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export const NEWSLETTER_ICONS = [
  "payments",
  "local_shipping",
  "assignment_return",
  "verified",
  "local_offer",
  "campaign",
  "shield",
  "support_agent",
  "schedule",
] as const;

export type NewsletterIcon = (typeof NEWSLETTER_ICONS)[number];

export type NewsletterPerk = {
  id: string;
  icon: string;
  label: string;
  isActive: boolean;
};

export type NewsletterDraft = {
  icon: string;
  label: string;
  isActive: boolean;
};

export type NewsletterSection = {
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  cta: string;
  success: string;
  perks: NewsletterPerk[];
};

export type NewsletterPublicPerk = {
  id: string;
  icon: string;
  label: string;
};

export type NewsletterPublic = {
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  cta: string;
  success: string;
  perks: NewsletterPublicPerk[];
};

type ApiPerk = {
  id: string;
  icon: string;
  label: string;
  is_active?: boolean;
};

type ApiSection = {
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  cta: string;
  success: string;
  perks: ApiPerk[];
};

export const FALLBACK_NEWSLETTER: NewsletterPublic = {
  eyebrow: "অফার ও আপডেট",
  title: "নতুন অফার মিস করবেন না",
  subtitle: "ইমেইলে পান ফ্ল্যাশ সেল, নতুন গ্যাজেট লঞ্চ আর বিশেষ ছাড়ের খবর।",
  placeholder: "আপনার ইমেইল লিখুন",
  cta: "সাবস্ক্রাইব",
  success: "ধন্যবাদ! শীঘ্রই আপডেট পাবেন।",
  perks: [
    { id: "offers", icon: "local_offer", label: "ফ্ল্যাশ অফার আপডেট" },
    { id: "gadgets", icon: "campaign", label: "নতুন গ্যাজেট আগে জানুন" },
    { id: "spam", icon: "shield", label: "স্প্যাম নেই" },
  ],
};

export function blankNewsletterDraft(): NewsletterDraft {
  return { icon: "local_offer", label: "", isActive: true };
}

export function newsletterIcon(icon: string) {
  return (NEWSLETTER_ICONS as readonly string[]).includes(icon) ? icon : "local_offer";
}

function toPerk(body: ApiPerk): NewsletterPerk {
  return {
    id: body.id,
    icon: body.icon,
    label: body.label,
    isActive: body.is_active !== false,
  };
}

function toSection(body: ApiSection): NewsletterSection {
  return {
    eyebrow: body.eyebrow,
    title: body.title,
    subtitle: body.subtitle,
    placeholder: body.placeholder,
    cta: body.cta,
    success: body.success,
    perks: body.perks.map(toPerk),
  };
}

export async function getNewsletterSection(): Promise<NewsletterSection> {
  const response = await authorizedFetch("/api/v1/admin/home/newsletter");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the newsletter."));
  }
  return toSection((await response.json()) as ApiSection);
}

export async function updateNewsletterCopy(copy: {
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  cta: string;
  success: string;
}): Promise<NewsletterSection> {
  const response = await authorizedFetch("/api/v1/admin/home/newsletter", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(copy),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the heading."));
  }
  return toSection((await response.json()) as ApiSection);
}

export async function createNewsletterPerk(draft: NewsletterDraft): Promise<NewsletterPerk> {
  const response = await authorizedFetch("/api/v1/admin/home/newsletter/perks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ icon: draft.icon, label: draft.label, is_active: draft.isActive }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the perk."));
  }
  return toPerk((await response.json()) as ApiPerk);
}

export async function updateNewsletterPerk(id: string, draft: NewsletterDraft): Promise<NewsletterPerk> {
  const response = await authorizedFetch(`/api/v1/admin/home/newsletter/perks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ icon: draft.icon, label: draft.label, is_active: draft.isActive }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the perk."));
  }
  return toPerk((await response.json()) as ApiPerk);
}

export async function deleteNewsletterPerk(id: string) {
  const response = await authorizedFetch(`/api/v1/admin/home/newsletter/perks/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not remove the perk."));
  }
}

export async function reorderNewsletterPerks(ids: string[]): Promise<NewsletterSection> {
  const response = await authorizedFetch("/api/v1/admin/home/newsletter/perks/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not reorder the perks."));
  }
  return toSection((await response.json()) as ApiSection);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicNewsletter(): Promise<NewsletterPublic | null> {
  try {
    const response = await fetch(`${API}/api/v1/home/newsletter`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as ApiSection;
    const section = toSection(body);
    return {
      eyebrow: section.eyebrow,
      title: section.title,
      subtitle: section.subtitle,
      placeholder: section.placeholder,
      cta: section.cta,
      success: section.success,
      perks: section.perks.map((perk) => ({
        id: perk.id,
        icon: newsletterIcon(perk.icon),
        label: perk.label,
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
  if (response.status === 401) return "Sign in again to edit the newsletter.";
  return fallback;
}
