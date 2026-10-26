"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankFaqDraft,
  createFaqItem,
  deleteFaqItem,
  getFaqSection,
  reorderFaqItems,
  updateFaqCopy,
  updateFaqItem,
  type FaqDraft,
  type FaqItem,
  type FaqSection,
} from "@/lib/mart-api/faq";
import { MartApiError } from "@/lib/mart-api/products";
import { isContentActive } from "@/lib/mart-mock/visibility";
import { cn } from "@/lib/utils";

import { AdminFormModal } from "../../_components/admin-form-modal";
import {
  ActiveStatusField,
  adminButtonClass,
  adminFieldClass,
  FieldError,
  FieldLabel,
  VisibilityBadge,
} from "../../_components/admin-ui";
import { FormCloseGuard } from "../../_components/form-close-guard";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

const CATEGORY_ICONS: Record<string, string> = {
  "অর্ডার ট্র্যাকিং": "package_2",
  "পেমেন্ট ও ক্যাশ অন ডেলিভারি": "payments",
  "রিটার্ন ও রিপ্লেসমেন্ট": "assignment_return",
  "কাস্টমার সাপোর্ট": "support_agent",
  "প্রোডাক্ট কোয়ালিটি": "verified",
  "ডেলিভারি সময়": "schedule",
};

export function HomeFaq() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const [section, setSection] = useState<FaqSection | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<FaqDraft | null>(null);
  const [baseline, setBaseline] = useState<FaqDraft | null>(null);
  const [errors, setErrors] = useState<{ question?: string; answer?: string }>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const questionId = useId();
  const items = section?.items ?? [];
  const visible = items.filter(isContentActive);

  useEffect(() => {
    let cancelled = false;
    getFaqSection()
      .then((next) => {
        if (!cancelled) setSection(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof MartApiError
            ? error.message
            : "Could not load the questions.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (
    (selected === null || selected === "new" || section) &&
    selected !== openKey
  ) {
    setOpenKey(selected);
    setErrors({});
    setFormError("");
    if (!selected) {
      setDraft(null);
      setBaseline(null);
    } else if (selected === "new") {
      const next = blankFaqDraft();
      setDraft(next);
      setBaseline(next);
    } else {
      const item = section?.items.find((entry) => entry.id === selected);
      const next = item ? draftFrom(item) : null;
      setDraft(next);
      setBaseline(next);
    }
  }

  useEffect(() => {
    if (draft || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(`faq-${id}`)?.focus();
  }, [draft]);

  function setEdit(id: string | null) {
    const next = new URLSearchParams(window.location.search);
    if (id) next.set("edit", id);
    else next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice("");
      setSavedId(null);
    }, 1600);
  }

  async function saveCopy(next: {
    kicker?: string;
    title?: string;
    subtitle?: string;
    moreLabel?: string;
    moreHref?: string;
  }) {
    if (!section) return;
    setSection(
      await updateFaqCopy({
        kicker: next.kicker ?? "",
        title: next.title ?? "",
        subtitle: next.subtitle ?? "",
        moreLabel: next.moreLabel ?? "",
        moreHref: next.moreHref ?? "",
      }),
    );
  }

  async function save() {
    if (!draft || saving || !section) return;
    const question = draft.question.trim();
    const answer = draft.answer.trim();
    const nextErrors: { question?: string; answer?: string } = {};
    if (!question) nextErrors.question = "Question is required.";
    if (!answer) nextErrors.answer = "Answer is required.";
    if (nextErrors.question || nextErrors.answer) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    setFormError("");
    const nextDraft = {
      ...draft,
      category: draft.category.trim(),
      question,
      answer,
    };
    try {
      if (creating) {
        const item = await createFaqItem(nextDraft);
        setSection({ ...section, items: [...section.items, item] });
        setSavedId(item.id);
        focusId.current = item.id;
      } else if (selected) {
        const item = await updateFaqItem(selected, nextDraft);
        setSection({
          ...section,
          items: section.items.map((entry) =>
            entry.id === selected ? item : entry,
          ),
        });
        setSavedId(selected);
        focusId.current = selected;
      }
      setSaving(false);
      flash("Saved");
      setEdit(null);
    } catch (error) {
      setSaving(false);
      setFormError(
        error instanceof MartApiError
          ? error.message
          : "Could not save the question.",
      );
    }
  }

  async function remove(id: string) {
    if (!section) return;
    setLoadError("");
    try {
      await deleteFaqItem(id);
      setSection({
        ...section,
        items: section.items.filter((item) => item.id !== id),
      });
      if (selected === id) setEdit(null);
      setConfirmId(null);
      flash("Removed");
    } catch (error) {
      setLoadError(
        error instanceof MartApiError
          ? error.message
          : "Could not remove the question.",
      );
    }
  }

  async function applyOrder(ids: string[]) {
    setLoadError("");
    try {
      setSection(await reorderFaqItems(ids));
    } catch (error) {
      setLoadError(
        error instanceof MartApiError
          ? error.message
          : "Could not reorder the questions.",
      );
    }
  }

  function move(id: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    void applyOrder(next.map((entry) => entry.id));
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = [...items];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    setDragId(null);
    setOverId(null);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    void applyOrder(next.map((entry) => entry.id));
  }

  const missing = Boolean(
    section && selected && selected !== "new" && openKey === selected && !draft,
  );

  if (!section && !loadError) {
    return (
      <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="FAQ"
        description="Manage the questions and answers displayed on your storefront."
        sectionId="faq"
        extra={
          <button
            type="button"
            onClick={() => setEdit("new")}
            className={adminButtonClass.primary}
          >
            <MaterialIcon name="add" className="text-[18px]" />
            Add question
          </button>
        }
      />

      {loadError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {loadError}
        </p>
      ) : null}
      {notice && !draft ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The question list is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This question is no longer here.{" "}
          <button
            type="button"
            onClick={() => setEdit(null)}
            className="font-medium text-primary"
          >
            Close
          </button>
        </p>
      ) : null}

      {section ? (
        <section
          className="overflow-hidden rounded-2xl bg-[#f7f8f8] ring-1 ring-neutral-200/90"
          aria-labelledby="faq-preview-heading"
        >
          <div className="px-4 pt-4 sm:px-5">
            <h2
              id="faq-preview-heading"
              className="text-sm font-semibold text-neutral-950"
            >
              Storefront preview
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Shown on the home page in this order, split into two columns.
              Hidden questions stay off the home page.
            </p>
          </div>
          <div className="px-4 py-4 sm:px-5">
            <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 sm:px-5 sm:py-5">
              <SectionCopyForm
                values={{
                  kicker: section.kicker,
                  title: section.title,
                  subtitle: section.subtitle,
                  moreLabel: section.moreLabel,
                  moreHref: section.moreHref,
                }}
                fields={[
                  { name: "kicker", label: "Eyebrow" },
                  { name: "title", label: "Title" },
                  {
                    name: "subtitle",
                    label: "Subtitle",
                    multiline: true,
                    wide: true,
                  },
                  { name: "moreLabel", label: "More link label" },
                  { name: "moreHref", label: "More link" },
                ]}
                saveLabel="Save heading"
                onSave={saveCopy}
              />
              {visible.length === 0 ? (
                <div className="px-2 py-10 text-center">
                  <p className="text-sm font-semibold text-neutral-950">
                    {items.length === 0
                      ? "No questions yet"
                      : "All questions are hidden."}
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                    Add a question so customers can find a short answer on the
                    home page.
                  </p>
                  {items.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setEdit("new")}
                      className={cn(adminButtonClass.primary, "mt-4")}
                    >
                      <MaterialIcon name="add" className="text-[18px]" />
                      Add question
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 grid items-start gap-3 md:grid-cols-2">
                  {[0, 1].map((column) => (
                    <ul key={column} className="space-y-3">
                      {visible
                        .filter((_, index) => index % 2 === column)
                        .map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => setEdit(item.id)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 text-left",
                                selected === item.id && "ring-2 ring-primary",
                              )}
                            >
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                                <MaterialIcon
                                  name={
                                    CATEGORY_ICONS[item.category] ??
                                    "help_outline"
                                  }
                                  className="text-[18px]"
                                />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-neutral-950">
                                  {item.question || "Untitled question"}
                                </span>
                                {item.category ? (
                                  <span className="mt-1 block text-xs text-neutral-500">
                                    {item.category}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {items.length > 0 ? (
        <section
          className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90"
          aria-labelledby="faq-list-heading"
        >
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2
              id="faq-list-heading"
              className="text-sm font-semibold text-neutral-950"
            >
              {items.length === 1 ? "1 question" : `${items.length} questions`}
            </h2>
          </div>
          <ol>
            {items.map((item, index) => (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(item.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dropOn(item.id);
                }}
                className={cn(
                  "border-t border-neutral-100 first:border-t-0",
                  selected === item.id && "bg-primary/5",
                  savedId === item.id && "bg-emerald-50",
                  overId === item.id &&
                    dragId &&
                    dragId !== item.id &&
                    "bg-primary/10",
                  dragId === item.id && "opacity-60",
                )}
              >
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      draggable
                      aria-label={`Reorder ${item.question || "question"}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", item.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDragId(item.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                      className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <MaterialIcon
                        name="drag_indicator"
                        className="text-[18px]"
                      />
                    </button>
                    <button
                      id={`faq-${item.id}`}
                      type="button"
                      onClick={() => setEdit(item.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-500 tabular-nums">
                        {index + 1}
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                        <MaterialIcon
                          name={CATEGORY_ICONS[item.category] ?? "help_outline"}
                          className="text-[18px]"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-neutral-950">
                            {item.question || "Untitled question"}
                          </span>
                          <VisibilityBadge active={isContentActive(item)} />
                        </span>
                        <span className="block truncate text-xs text-neutral-500">
                          {item.category || "No category"}
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton
                      label="Move earlier"
                      icon="arrow_upward"
                      disabled={index === 0}
                      onClick={() => move(item.id, -1)}
                    />
                    <IconButton
                      label="Move later"
                      icon="arrow_downward"
                      disabled={index === items.length - 1}
                      onClick={() => move(item.id, 1)}
                    />
                    <button
                      type="button"
                      onClick={() => setEdit(item.id)}
                      className={adminButtonClass.quiet}
                    >
                      Edit
                    </button>
                    {confirmId === item.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        Remove from the home page?
                        <button
                          type="button"
                          onClick={() => void remove(item.id)}
                          className="font-semibold underline"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="font-semibold"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <IconButton
                        label="Remove question"
                        icon="delete"
                        danger
                        onClick={() => setConfirmId(item.id)}
                      />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {draft && baseline ? (
        <FormCloseGuard
          baseline={baseline}
          value={draft}
          onClose={() => setEdit(null)}
        >
          <AdminFormModal titleId="faq-drawer-title" size="md">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0">
                <h2
                  id="faq-drawer-title"
                  className="text-lg font-semibold text-neutral-950"
                >
                  {creating ? "Add question" : "Edit question"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {creating
                    ? "Add a question and answer for the home page."
                    : "Update this question."}
                </p>
              </div>
              <button
                type="button"
                data-form-dismiss=""
                aria-label="Close"
                title="Close"
                onClick={() => setEdit(null)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="rounded-2xl border border-neutral-200/90 px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                    <MaterialIcon
                      name={
                        CATEGORY_ICONS[draft.category.trim()] ?? "help_outline"
                      }
                      className="text-[18px]"
                    />
                  </span>
                  <p className="min-w-0 text-sm font-semibold text-neutral-950">
                    {draft.question.trim() || "Question"}
                  </p>
                </div>
                {draft.answer.trim() ? (
                  <p className="mt-3 border-t border-neutral-100 pt-3 text-sm leading-relaxed text-neutral-600">
                    {draft.answer}
                  </p>
                ) : null}
              </div>
              <ActiveStatusField
                checked={draft.isActive !== false}
                onChange={(isActive) => setDraft({ ...draft, isActive })}
              />
              <div>
                <FieldLabel htmlFor={`${questionId}-category`}>
                  Category
                </FieldLabel>
                <input
                  id={`${questionId}-category`}
                  value={draft.category}
                  placeholder="Orders"
                  onChange={(event) =>
                    setDraft({ ...draft, category: event.target.value })
                  }
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={questionId}>
                  Question <span className="text-red-700">*</span>
                </FieldLabel>
                <input
                  id={questionId}
                  autoFocus
                  value={draft.question}
                  placeholder="How do I place an order?"
                  onChange={(event) => {
                    setDraft({ ...draft, question: event.target.value });
                    setErrors((current) => ({
                      ...current,
                      question: undefined,
                    }));
                  }}
                  aria-invalid={errors.question ? true : undefined}
                  aria-describedby={
                    errors.question ? `${questionId}-error` : undefined
                  }
                  className={cn(
                    adminFieldClass,
                    errors.question && "border-red-400",
                  )}
                />
                {errors.question ? (
                  <div id={`${questionId}-error`}>
                    <FieldError message={errors.question} />
                  </div>
                ) : null}
              </div>
              <div>
                <FieldLabel htmlFor={`${questionId}-answer`}>
                  Answer <span className="text-red-700">*</span>
                </FieldLabel>
                <textarea
                  id={`${questionId}-answer`}
                  value={draft.answer}
                  rows={5}
                  placeholder="The answer customers should see"
                  onChange={(event) => {
                    setDraft({ ...draft, answer: event.target.value });
                    setErrors((current) => ({ ...current, answer: undefined }));
                  }}
                  aria-invalid={errors.answer ? true : undefined}
                  aria-describedby={
                    errors.answer ? `${questionId}-answer-error` : undefined
                  }
                  className={cn(
                    adminFieldClass,
                    "h-auto py-3",
                    errors.answer && "border-red-400",
                  )}
                />
                {errors.answer ? (
                  <div id={`${questionId}-answer-error`}>
                    <FieldError message={errors.answer} />
                  </div>
                ) : null}
              </div>
              {formError ? <FieldError message={formError} /> : null}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
              {notice ? (
                <p
                  role="status"
                  className="mr-auto text-sm font-medium text-emerald-800"
                >
                  {notice}
                </p>
              ) : null}
              <button
                type="button"
                data-form-dismiss=""
                onClick={() => setEdit(null)}
                className={adminButtonClass.secondary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className={adminButtonClass.primary}
              >
                {saving
                  ? "Saving…"
                  : creating
                    ? "Save question"
                    : "Save changes"}
              </button>
            </div>
          </AdminFormModal>
        </FormCloseGuard>
      ) : null}
    </div>
  );
}

function draftFrom(item: FaqItem): FaqDraft {
  return {
    category: item.category,
    question: item.question,
    answer: item.answer,
    isActive: item.isActive,
  };
}

function IconButton({
  label,
  icon,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-30",
        danger && "hover:bg-red-50 hover:text-red-600",
      )}
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}
