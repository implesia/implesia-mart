import { FALLBACK_CONTACT_FORM, fillContactForm } from "@/lib/mart-api/contact-fallback";
import { MartApiError, authorizedFetch } from "@/lib/mart-api/products";

export type ContactFormField = {
  label: string;
  placeholder: string;
};

export type ContactFormFields = {
  name: ContactFormField;
  phone: ContactFormField;
  subject: ContactFormField;
  message: ContactFormField;
};

export type ContactForm = {
  isActive: boolean;
  title: string;
  subtitle: string;
  cta: string;
  hint: string;
  fields: ContactFormFields;
};

type ApiField = { label?: string; placeholder?: string };
type ApiFields = {
  name?: ApiField;
  phone?: ApiField;
  subject?: ApiField;
  message?: ApiField;
};
type ApiForm = {
  is_active?: boolean;
  title: string;
  subtitle?: string;
  cta?: string;
  hint?: string;
  fields?: ApiFields;
};

function field(body: ApiField | undefined): ContactFormField {
  return { label: body?.label ?? "", placeholder: body?.placeholder ?? "" };
}

function toForm(body: ApiForm, active: boolean): ContactForm {
  return {
    isActive: active,
    title: body.title,
    subtitle: body.subtitle ?? "",
    cta: body.cta ?? "",
    hint: body.hint ?? "",
    fields: {
      name: field(body.fields?.name),
      phone: field(body.fields?.phone),
      subject: field(body.fields?.subject),
      message: field(body.fields?.message),
    },
  };
}

function toBody(form: ContactForm) {
  return {
    is_active: form.isActive,
    title: form.title,
    subtitle: form.subtitle,
    cta: form.cta,
    hint: form.hint,
    fields: form.fields,
  };
}

export async function getContactForm(): Promise<ContactForm> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/form");
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not load the form."));
  }
  const body = (await response.json()) as ApiForm;
  return toForm(body, body.is_active !== false);
}

export async function saveContactForm(form: ContactForm): Promise<ContactForm> {
  const response = await authorizedFetch("/api/v1/admin/pages/contact/form", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBody(form)),
  });
  if (!response.ok) {
    throw new MartApiError(await readError(response, "Could not save the form."));
  }
  const body = (await response.json()) as ApiForm;
  return toForm(body, body.is_active !== false);
}

const API = process.env.NEXT_PUBLIC_MART_API_URL ?? "http://127.0.0.1:8001";

export async function listPublicContactForm(): Promise<ContactForm | null> {
  try {
    const response = await fetch(`${API}/api/v1/pages/contact/form`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return FALLBACK_CONTACT_FORM;
    const body = (await response.json()) as ApiForm;
    if (!body.title.trim()) {
      return toForm({ ...body, title: "" }, false);
    }
    return fillContactForm(toForm(body, true));
  } catch {
    return FALLBACK_CONTACT_FORM;
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* not the API envelope */
  }
  if (response.status === 401) return "Sign in again to edit the contact page.";
  return fallback;
}
