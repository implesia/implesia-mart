"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";
import {
  blankFaq,
  readHomeSections,
  saveHomeSections,
  type FaqItem,
  type FaqSectionContent,
} from "@/lib/mart-mock/home-sections";

import { adminButtonClass, adminFieldClass, FieldError, FieldLabel } from "../../_components/admin-ui";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

type Draft = Pick<FaqItem, "category" | "question" | "answer">;

const CATEGORY_ICONS: Record<string, string> = {
  "অর্ডার ট্র্যাকিং": "package_2",
  "পেমেন্ট ও ক্যাশ অন ডেলিভারি": "payments",
  "রিটার্ন ও রিপ্লেসমেন্ট": "assignment_return",
  "কাস্টমার সাপোর্ট": "support_agent",
  "প্রোডাক্ট কোয়ালিটি": "verified",
  "ডেলিভারি সময়": "schedule",
};

export function HomeFaq({ section }: { section: FaqSectionContent }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const items = section.items;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<{ question?: string; answer?: string }>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);
  const loaded = useRef<string | null>(null);
  const focusId = useRef<string | null>(null);
  const questionId = useId();

  useEffect(() => {
    if (loaded.current === selected) return;
    loaded.current = selected;
    setResolved(selected);
    setErrors({});
    if (!selected) {
      setDraft(null);
      return;
    }
    if (selected === "new") {
      const blank = blankFaq();
      setDraft({ category: blank.category, question: blank.question, answer: blank.answer });
      return;
    }
    const item = readHomeSections().faq.items.find((entry) => entry.id === selected);
    setDraft(item ? { category: item.category, question: item.question, answer: item.answer } : null);
  }, [selected]);

  useEffect(() => {
    if (!draft) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [draft]);

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
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice("");
      setSavedId(null);
    }, 1600);
  }

  function patchCopy(partial: Partial<Omit<FaqSectionContent, "items">>) {
    const doc = readHomeSections();
    saveHomeSections({ ...doc, faq: { ...doc.faq, ...partial } });
  }

  function save() {
    if (!draft || saving) return;
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
    const doc = readHomeSections();
    const category = draft.category.trim();
    if (creating) {
      const item = { ...blankFaq(), category, question, answer };
      saveHomeSections({ ...doc, faq: { ...doc.faq, items: [...doc.faq.items, item] } });
      setSavedId(item.id);
      focusId.current = item.id;
    } else if (selected) {
      saveHomeSections({
        ...doc,
        faq: {
          ...doc.faq,
          items: doc.faq.items.map((entry) => (entry.id === selected ? { ...entry, category, question, answer } : entry)),
        },
      });
      setSavedId(selected);
      focusId.current = selected;
    }
    setSaving(false);
    flash("Saved");
    setEdit(null);
  }

  function remove(id: string) {
    const doc = readHomeSections();
    saveHomeSections({ ...doc, faq: { ...doc.faq, items: doc.faq.items.filter((item) => item.id !== id) } });
    if (selected === id) setEdit(null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(id: string, direction: -1 | 1) {
    const doc = readHomeSections();
    const index = doc.faq.items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= doc.faq.items.length) return;
    const next = [...doc.faq.items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveHomeSections({ ...doc, faq: { ...doc.faq, items: next } });
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readHomeSections();
    const next = [...doc.faq.items];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveHomeSections({ ...doc, faq: { ...doc.faq, items: next } });
    setDragId(null);
    setOverId(null);
  }

  const missing = Boolean(selected && selected !== "new" && resolved === selected && !draft);
  const editingTitle = draft?.question.trim() || "Question";

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="FAQ"
        description="Manage the questions and answers displayed on your storefront."
        sectionId="faq"
        extra={
          <button type="button" onClick={() => setEdit("new")} className={adminButtonClass.primary}>
            <MaterialIcon name="add" className="text-[18px]" />
            Add question
          </button>
        }
      />

      {notice && !draft ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The question list is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This question is no longer here.{" "}
          <button type="button" onClick={() => setEdit(null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-[#f7f8f8] ring-1 ring-neutral-200/90" aria-labelledby="faq-preview-heading">
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="faq-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Shown on the home page in this order, split into two columns. Every question in the list appears there.
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
                { name: "subtitle", label: "Subtitle", multiline: true, wide: true },
                { name: "moreLabel", label: "More link label" },
                { name: "moreHref", label: "More link" },
              ]}
              saveLabel="Save heading"
              onSave={(next) =>
                patchCopy({
                  kicker: next.kicker ?? "",
                  title: next.title ?? "",
                  subtitle: next.subtitle ?? "",
                  moreLabel: next.moreLabel ?? "",
                  moreHref: next.moreHref ?? "",
                })
              }
            />
            {items.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <p className="text-sm font-semibold text-neutral-950">No questions yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                  Add a question so customers can find a short answer on the home page.
                </p>
                <button type="button" onClick={() => setEdit("new")} className={cn(adminButtonClass.primary, "mt-4")}>
                  <MaterialIcon name="add" className="text-[18px]" />
                  Add question
                </button>
              </div>
            ) : (
              <div className="mt-4 grid items-start gap-3 md:grid-cols-2">
                {[0, 1].map((column) => (
                  <ul key={column} className="space-y-3">
                    {items
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
                              <MaterialIcon name={CATEGORY_ICONS[item.category] ?? "help_outline"} className="text-[18px]" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-neutral-950">{item.question || "Untitled question"}</span>
                              {item.category ? <span className="mt-1 block text-xs text-neutral-500">{item.category}</span> : null}
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

      {items.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="faq-list-heading">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2 id="faq-list-heading" className="text-sm font-semibold text-neutral-950">
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
                  overId === item.id && dragId && dragId !== item.id && "bg-primary/10",
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
                      className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <MaterialIcon name="drag_indicator" className="text-[18px]" />
                    </button>
                    <button
                      id={`faq-${item.id}`}
                      type="button"
                      onClick={() => setEdit(item.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">{index + 1}</span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                        <MaterialIcon name={CATEGORY_ICONS[item.category] ?? "help_outline"} className="text-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-950">{item.question || "Untitled question"}</span>
                        <span className="block truncate text-xs text-neutral-500">{item.category || "No category"}</span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton label="Move earlier" icon="arrow_upward" disabled={index === 0} onClick={() => move(item.id, -1)} />
                    <IconButton label="Move later" icon="arrow_downward" disabled={index === items.length - 1} onClick={() => move(item.id, 1)} />
                    <button type="button" onClick={() => setEdit(item.id)} className={adminButtonClass.quiet}>
                      Edit
                    </button>
                    {confirmId === item.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        Remove from the home page?
                        <button type="button" onClick={() => remove(item.id)} className="font-semibold underline">
                          Yes
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                          No
                        </button>
                      </span>
                    ) : (
                      <IconButton label="Remove question" icon="delete" danger onClick={() => setConfirmId(item.id)} />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {draft ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/40" role="presentation" onClick={() => setEdit(null)}>
          <div
            key={selected ?? "closed"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-drawer-title"
            className="force-light flex h-full w-full max-w-md flex-col bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") setEdit(null);
            }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{creating ? "Add question" : "Edit question"}</p>
                <h2 id="faq-drawer-title" className="mt-1 line-clamp-2 text-lg font-semibold text-neutral-950">
                  {creating ? "New question" : editingTitle}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEdit(null)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="rounded-2xl border border-neutral-200/90 px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                    <MaterialIcon name={CATEGORY_ICONS[draft.category.trim()] ?? "help_outline"} className="text-[18px]" />
                  </span>
                  <p className="min-w-0 text-sm font-semibold text-neutral-950">{draft.question.trim() || "Question"}</p>
                </div>
                {draft.answer.trim() ? <p className="mt-3 border-t border-neutral-100 pt-3 text-sm leading-relaxed text-neutral-600">{draft.answer}</p> : null}
              </div>
              <div>
                <FieldLabel htmlFor={`${questionId}-category`}>Category</FieldLabel>
                <input
                  id={`${questionId}-category`}
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
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
                  onChange={(event) => {
                    setDraft({ ...draft, question: event.target.value });
                    setErrors((current) => ({ ...current, question: undefined }));
                  }}
                  aria-invalid={errors.question ? true : undefined}
                  aria-describedby={errors.question ? `${questionId}-error` : undefined}
                  className={cn(adminFieldClass, errors.question && "border-red-400")}
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
                  onChange={(event) => {
                    setDraft({ ...draft, answer: event.target.value });
                    setErrors((current) => ({ ...current, answer: undefined }));
                  }}
                  aria-invalid={errors.answer ? true : undefined}
                  aria-describedby={errors.answer ? `${questionId}-answer-error` : undefined}
                  className={cn(adminFieldClass, "h-auto py-3", errors.answer && "border-red-400")}
                />
                {errors.answer ? (
                  <div id={`${questionId}-answer-error`}>
                    <FieldError message={errors.answer} />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
              {notice ? (
                <p role="status" className="mr-auto text-sm font-medium text-emerald-800">
                  {notice}
                </p>
              ) : null}
              <button type="button" onClick={() => setEdit(null)} className={adminButtonClass.secondary}>
                Cancel
              </button>
              <button type="button" onClick={save} disabled={saving} className={adminButtonClass.primary}>
                {saving ? "Saving…" : creating ? "Save question" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
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
