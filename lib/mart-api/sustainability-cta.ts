import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type SustainabilityCtaLink = {
  label: string;
  href: string;
};

export type SustainabilityCta = {
  title: string;
  subtitle: string;
  primaryCta: SustainabilityCtaLink;
  secondaryCta: SustainabilityCtaLink;
};

type ApiLink = { label?: string; href?: string };
type ApiCta = {
  title: string;
  subtitle: string;
  primary_cta?: ApiLink;
  secondary_cta?: ApiLink;
};

export const FALLBACK_SUSTAINABILITY_CTA: SustainabilityCta = {
  title: "কোয়ালিটি চেক করা গ্যাজেট ও গর্জিয়াস ড্রেস",
  subtitle: "হাতে পেয়ে দেখে তারপর ক্যাশ অন ডেলিভারি — সারাদেশে।",
  primaryCta: { label: "সব প্রোডাক্ট", href: "/products" },
  secondaryCta: { label: "যোগাযোগ", href: "/contact-us" },
};

function link(body: ApiLink | undefined): SustainabilityCtaLink {
  return { label: body?.label ?? "", href: body?.href ?? "" };
}

function toCta(body: ApiCta): SustainabilityCta {
  return {
    title: body.title,
    subtitle: body.subtitle,
    primaryCta: link(body.primary_cta),
    secondaryCta: link(body.secondary_cta),
  };
}

function toBody(cta: SustainabilityCta) {
  return {
    title: cta.title,
    subtitle: cta.subtitle,
    primary_cta: cta.primaryCta,
    secondary_cta: cta.secondaryCta,
  };
}

export async function getSustainabilityCta(): Promise<SustainabilityCta> {
  const response = await authorizedFetch("/api/v1/admin/pages/sustainability/cta");
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not load the call to action."),
    );
  }
  return toCta((await response.json()) as ApiCta);
}

export async function saveSustainabilityCta(
  cta: SustainabilityCta,
): Promise<SustainabilityCta> {
  const response = await authorizedFetch("/api/v1/admin/pages/sustainability/cta", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(cta)),
  });
  if (!response.ok) {
    throw new MartApiError(
      await readError(response, "Could not save the call to action."),
    );
  }
  return toCta((await response.json()) as ApiCta);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicSustainabilityCta(): Promise<SustainabilityCta | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/sustainability/cta`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return toCta((await response.json()) as ApiCta);
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
