"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  getContactForm,
  saveContactForm,
  type ContactForm,
} from "@/lib/mart-api/contact-form";
import { cn } from "@/lib/utils";

import {
  ActiveStatusField,
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  ContactCard,
  ContactHeader,
  ContactModal,
  setContactQuery,
  useContactNav,
  useReturnFocus,
} from "./contact-shared";

const FIELD_KEYS = ["name", "phone", "subject", "message"] as const;

type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_NAMES: Record<FieldKey, string> = {
  name: "Name",
  phone: "Phone",
  subject: "Subject",
  message: "Message",
};

type Draft = ContactForm;

function draftFrom(form: ContactForm): Draft {
  return {
    isActive: form.isActive !== false,
    title: form.title,
    subtitle: form.subtitle,
    cta: form.cta,
    hint: form.hint,
    fields: {
      name: { ...form.fields.name },
      phone: { ...form.fields.phone },
      subject: { ...form.fields.subject },
      message: { ...form.fields.message },
    },
  };
}

export function ContactFormEditor() {
  const [form, setForm] = useState<ContactForm | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useContactNav();
  const editing = params.has("edit");
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const empty =
    !form ||
    (!form.title.trim() && !form.subtitle.trim() && !form.cta.trim());

  useEffect(() => {
    let active = true;
    getContactForm()
      .then((next) => {
        if (active) setForm(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load the form.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setContactQuery(router, pathname, open, "form");
  }

  async function save(draft: Draft) {
    const saved = await saveContactForm({
      isActive: draft.isActive !== false,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      cta: draft.cta.trim(),
      hint: draft.hint.trim(),
      fields: {
        name: trimField(draft.fields.name),
        phone: trimField(draft.fields.phone),
        subject: trimField(draft.fields.subject),
        message: trimField(draft.fields.message),
      },
    });
    setForm(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!form) {
    return (
      <div className="min-w-0 space-y-4">
        <ContactHeader
          sectionId="form"
          title="Form"
          description="The message form beside the contact channels."
          editLabel="Edit form"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">
          {loadError || "Loading the form…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <ContactHeader
        sectionId="form"
        title="Form"
        description="The message form beside the contact channels."
        editLabel="Edit form"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ContactCard
        headingId="contact-form-card"
        title="Message form"
        description={
          form.isActive === false
            ? "Hidden on the contact page."
            : "Shown on the left of the contact page. Sending still opens WhatsApp."
        }
        active={form.isActive !== false}
        empty={empty}
        emptyTitle="No form content yet"
        emptyBody="Add the heading, field labels, and the send button."
      >
        <FormPreview form={form} />
      </ContactCard>
      {editing ? (
        <FormModal form={form} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function trimField(field: { label: string; placeholder: string }) {
  return { label: field.label.trim(), placeholder: field.placeholder.trim() };
}

function FormPreview({ form }: { form: ContactForm }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200 sm:p-5">
      <p className="text-lg font-semibold text-neutral-950">
        {form.title.trim() || "Title"}
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        {form.subtitle.trim() || "Subtitle"}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {FIELD_KEYS.map((key) => (
          <div key={key} className={key === "name" || key === "phone" ? "" : "sm:col-span-2"}>
            <p className="text-sm font-medium text-neutral-700">
              {form.fields[key].label.trim() || FIELD_NAMES[key]}
            </p>
            <p className="mt-1.5 rounded-xl bg-admin-canvas px-3.5 py-3 text-sm text-neutral-500">
              {form.fields[key].placeholder.trim() || "Placeholder"}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-on-primary">
        {form.cta.trim() || "Send"}
        <MaterialIcon name="chat" className="text-[18px]" />
      </p>
      {form.hint.trim() ? (
        <p className="mt-2 text-center text-xs text-neutral-500">{form.hint}</p>
      ) : null}
    </div>
  );
}

function FormModal({
  form,
  onClose,
  onSave,
}: {
  form: ContactForm;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(form);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [buttonError, setButtonError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    const nextTitle = draft.title.trim() ? "" : "Title is required.";
    const nextFields = FIELD_KEYS.some((key) => !draft.fields[key].label.trim())
      ? "Each field needs a label."
      : "";
    const nextButton = draft.cta.trim() ? "" : "Button label is required.";
    setTitleError(nextTitle);
    setFieldError(nextFields);
    setButtonError(nextButton);
    if (nextTitle || nextFields || nextButton) return;
    setSaving(true);
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      const message =
        caught instanceof Error ? caught.message : "Could not save the form.";
      if (message === "Each field needs a label.") setFieldError(message);
      else if (message === "Button label is required.") setButtonError(message);
      else setTitleError(message);
    }
  }

  function setField(key: FieldKey, patch: Partial<Draft["fields"]["name"]>) {
    setDraft({
      ...draft,
      fields: { ...draft.fields, [key]: { ...draft.fields[key], ...patch } },
    });
    setFieldError("");
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ContactModal
        titleId="contact-form-drawer-title"
        title="Edit form"
        description="Update the labels on the message form. The four fields stay in place."
        size="lg"
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive !== false}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <section aria-labelledby={`${formId}-content`}>
          <h3 id={`${formId}-content`} className="text-sm font-semibold text-neutral-950">
            Content
          </h3>
          <div className="mt-3 grid gap-3">
            <div>
              <FieldLabel htmlFor={`${formId}-title`}>
                Title <span className="text-red-700">*</span>
              </FieldLabel>
              <input
                id={`${formId}-title`}
                autoFocus
                value={draft.title}
                placeholder="Send a message"
                onChange={(event) => {
                  setDraft({ ...draft, title: event.target.value });
                  setTitleError("");
                }}
                className={cn(adminFieldClass, titleError && "border-red-400")}
              />
              {titleError ? <FieldError message={titleError} /> : null}
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-subtitle`}>Subtitle</FieldLabel>
              <textarea
                id={`${formId}-subtitle`}
                value={draft.subtitle}
                rows={2}
                placeholder="What happens after someone sends the form"
                onChange={(event) =>
                  setDraft({ ...draft, subtitle: event.target.value })
                }
                className={cn(adminFieldClass, "h-auto py-3")}
              />
            </div>
          </div>
        </section>
        <section className="border-t border-neutral-100 pt-5" aria-labelledby={`${formId}-fields`}>
          <h3 id={`${formId}-fields`} className="text-sm font-semibold text-neutral-950">
            Fields
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Name and phone sit side by side. Subject and message are full width.
          </p>
          {fieldError ? (
            <div className="mt-3">
              <FieldError message={fieldError} />
            </div>
          ) : null}
          <div className="mt-3 space-y-3">
            {FIELD_KEYS.map((key) => (
              <div key={key} className="rounded-2xl bg-admin-canvas p-3">
                <p className="mb-3 text-sm font-medium text-neutral-950">
                  {FIELD_NAMES[key]}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor={`${formId}-${key}-label`}>
                      Label <span className="text-red-700">*</span>
                    </FieldLabel>
                    <input
                      id={`${formId}-${key}-label`}
                      value={draft.fields[key].label}
                      aria-label={`${FIELD_NAMES[key]} label`}
                      onChange={(event) =>
                        setField(key, { label: event.target.value })
                      }
                      className={cn(
                        adminFieldClass,
                        fieldError &&
                          !draft.fields[key].label.trim() &&
                          "border-red-400",
                      )}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`${formId}-${key}-placeholder`}>
                      Placeholder
                    </FieldLabel>
                    <input
                      id={`${formId}-${key}-placeholder`}
                      value={draft.fields[key].placeholder}
                      aria-label={`${FIELD_NAMES[key]} placeholder`}
                      onChange={(event) =>
                        setField(key, { placeholder: event.target.value })
                      }
                      className={adminFieldClass}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-neutral-100 pt-5" aria-labelledby={`${formId}-button`}>
          <h3 id={`${formId}-button`} className="text-sm font-semibold text-neutral-950">
            Button
          </h3>
          <div className="mt-3 grid gap-3">
            <div>
              <FieldLabel htmlFor={`${formId}-cta`}>
                Button label <span className="text-red-700">*</span>
              </FieldLabel>
              <input
                id={`${formId}-cta`}
                value={draft.cta}
                placeholder="Send on WhatsApp"
                onChange={(event) => {
                  setDraft({ ...draft, cta: event.target.value });
                  setButtonError("");
                }}
                className={cn(adminFieldClass, buttonError && "border-red-400")}
              />
              {buttonError ? <FieldError message={buttonError} /> : null}
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-hint`}>Hint</FieldLabel>
              <input
                id={`${formId}-hint`}
                value={draft.hint}
                placeholder="WhatsApp opens in a new tab."
                onChange={(event) =>
                  setDraft({ ...draft, hint: event.target.value })
                }
                className={adminFieldClass}
              />
            </div>
          </div>
        </section>
      </ContactModal>
    </FormCloseGuard>
  );
}
