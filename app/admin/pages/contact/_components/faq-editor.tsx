"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  getContactFaq,
  saveContactFaq,
  type ContactFaq,
  type ContactFaqItem,
} from "@/lib/mart-api/contact-faq";
import { cn } from "@/lib/utils";

import { ActiveStatusField, adminButtonClass, adminFieldClass, FieldError, FieldLabel } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  ContactCard,
  ContactHeader,
  ContactModal,
  ItemToolbar,
  setContactQuery,
  useContactNav,
  useReturnFocus,
  VisibilitySwitch,
} from "./contact-shared";

type Draft = ContactFaq;

function blankItem(): ContactFaqItem {
  return {
    id: `faq-${crypto.randomUUID()}`,
    question: "",
    answer: "",
    isActive: true,
  };
}

function draftFrom(faq: ContactFaq): Draft {
  return {
    isActive: faq.isActive !== false,
    title: faq.title,
    subtitle: faq.subtitle,
    items: faq.items.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

export function ContactFaqEditor() {
  const [faq, setFaq] = useState<ContactFaq | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useContactNav();
  const editing = params.has("edit");
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const empty =
    !faq || (!faq.title.trim() && !faq.subtitle.trim() && faq.items.length === 0);

  useEffect(() => {
    let active = true;
    getContactFaq()
      .then((next) => {
        if (active) setFaq(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load the FAQ.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setContactQuery(router, pathname, open, "faq");
  }

  async function save(draft: Draft) {
    const saved = await saveContactFaq({
      isActive: draft.isActive !== false,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      items: draft.items.map((item) => ({
        ...item,
        question: item.question.trim(),
        answer: item.answer.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setFaq(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!faq) {
    return (
      <div className="min-w-0 space-y-4">
        <ContactHeader
          sectionId="faq"
          title="FAQ"
          description="Short questions on the contact page."
          editLabel="Edit FAQ"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">
          {loadError || "Loading the FAQ…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <ContactHeader
        sectionId="faq"
        title="FAQ"
        description="Short questions on the contact page."
        editLabel="Edit FAQ"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <ContactCard
        headingId="contact-faq-card"
        title="FAQ"
        description={
          faq.isActive === false
            ? "Hidden on the contact page."
            : "Shown at the bottom of the contact page. Questions stay in this order."
        }
        active={faq.isActive !== false}
        empty={empty}
        emptyTitle="No questions yet"
        emptyBody="Add the short questions customers ask before they call."
      >
        <FaqPreview faq={faq} />
      </ContactCard>
      {editing ? (
        <FaqForm faq={faq} onClose={() => setEditing(false)} onSave={save} />
      ) : null}
    </div>
  );
}

function FaqPreview({ faq }: { faq: ContactFaq }) {
  return (
    <div>
      <p className="text-lg font-semibold text-neutral-950">
        {faq.title.trim() || "Title"}
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        {faq.subtitle.trim() || "Subtitle"}
      </p>
      {faq.items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No questions yet</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {faq.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-xl bg-white px-3 py-3 ring-1 ring-neutral-200",
                item.isActive === false && "opacity-50",
              )}
            >
              <p className="flex items-start gap-2 text-sm font-medium text-neutral-950">
                <MaterialIcon
                  name="help_outline"
                  className="mt-0.5 shrink-0 text-[18px] text-primary"
                />
                <span>
                  {item.question || "Question"}
                  {item.isActive === false ? " · Hidden" : ""}
                </span>
              </p>
              <p className="mt-1 line-clamp-2 pl-6 text-sm text-neutral-600">
                {item.answer || "Answer"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FaqForm({
  faq,
  onClose,
  onSave,
}: {
  faq: ContactFaq;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(faq);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [titleError, setTitleError] = useState("");
  const [itemError, setItemError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    const nextTitle = draft.title.trim() ? "" : "Title is required.";
    const nextItems = draft.items.some(
      (item) => !item.question.trim() || !item.answer.trim(),
    )
      ? "Each question needs a question and an answer."
      : "";
    setTitleError(nextTitle);
    setItemError(nextItems);
    if (nextTitle || nextItems) return;
    setSaving(true);
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      const message =
        caught instanceof Error ? caught.message : "Could not save the FAQ.";
      if (message === "Each question needs a question and an answer.") {
        setItemError(message);
      } else setTitleError(message);
    }
  }

  function update(id: string, patch: Partial<ContactFaqItem>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
    setItemError("");
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <ContactModal
        titleId="contact-faq-drawer-title"
        title="Edit FAQ"
        description="Update the questions at the bottom of the contact page."
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
                onChange={(event) =>
                  setDraft({ ...draft, subtitle: event.target.value })
                }
                className={cn(adminFieldClass, "h-auto py-3")}
              />
            </div>
          </div>
        </section>
        <section className="border-t border-neutral-100 pt-5" aria-labelledby={`${formId}-items`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id={`${formId}-items`} className="text-sm font-semibold text-neutral-950">
                Questions
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                These open on the contact page, one at a time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft((current) => ({
                  ...current,
                  items: [...current.items, blankItem()],
                }));
                setItemError("");
              }}
              className={adminButtonClass.secondary}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              Add question
            </button>
          </div>
          {itemError ? (
            <div className="mt-3">
              <FieldError message={itemError} />
            </div>
          ) : null}
          {draft.items.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No questions yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {draft.items.map((item, index) => (
                <li key={item.id} className="rounded-2xl bg-admin-canvas p-3">
                  <ItemToolbar
                    index={index}
                    total={draft.items.length}
                    noun="Question"
                    onMove={(direction) =>
                      setDraft((current) => {
                        const target = index + direction;
                        if (target < 0 || target >= current.items.length) {
                          return current;
                        }
                        const items = [...current.items];
                        const [moved] = items.splice(index, 1);
                        if (!moved) return current;
                        items.splice(target, 0, moved);
                        return { ...current, items };
                      })
                    }
                    onRemove={() => {
                      setDraft((current) => ({
                        ...current,
                        items: current.items.filter(
                          (entry) => entry.id !== item.id,
                        ),
                      }));
                      setItemError("");
                    }}
                  />
                  <div>
                    <FieldLabel htmlFor={`${formId}-${item.id}-question`}>
                      Question <span className="text-red-700">*</span>
                    </FieldLabel>
                    <input
                      id={`${formId}-${item.id}-question`}
                      value={item.question}
                      placeholder="What customers ask"
                      onChange={(event) =>
                        update(item.id, { question: event.target.value })
                      }
                      className={cn(
                        adminFieldClass,
                        itemError && !item.question.trim() && "border-red-400",
                      )}
                    />
                  </div>
                  <div className="mt-3">
                    <FieldLabel htmlFor={`${formId}-${item.id}-answer`}>
                      Answer <span className="text-red-700">*</span>
                    </FieldLabel>
                    <textarea
                      id={`${formId}-${item.id}-answer`}
                      value={item.answer}
                      rows={3}
                      placeholder="The short answer"
                      onChange={(event) =>
                        update(item.id, { answer: event.target.value })
                      }
                      className={cn(
                        adminFieldClass,
                        "h-auto py-3",
                        itemError && !item.answer.trim() && "border-red-400",
                      )}
                    />
                  </div>
                  <VisibilitySwitch
                    checked={item.isActive !== false}
                    label={
                      item.isActive !== false
                        ? `Hide question ${index + 1}`
                        : `Show question ${index + 1}`
                    }
                    onChange={(isActive) => update(item.id, { isActive })}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </ContactModal>
    </FormCloseGuard>
  );
}
