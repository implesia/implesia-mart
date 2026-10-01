"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankFaqQuestion,
  faqCategoryLabel,
  moveList,
  readFaqSections,
  saveFaqSections,
  type FaqQuestion,
} from "@/lib/mart-mock/faq-sections";
import { useFaqSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import {
  ActiveStatusField,
  adminButtonClass,
  adminFieldClass,
  FieldLabel,
  VisibilityBadge,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FaqHeader,
  FaqModal,
  FormError,
  Labeled,
  setFaqQuery,
  useFaqNav,
  useReturnFocus,
} from "./faq-shared";

type Draft = {
  id: string;
  isActive: boolean;
  categoryId: string;
  question: string;
  answer: string;
};

function draftFrom(item: FaqQuestion): Draft {
  return {
    id: item.id,
    isActive: item.isActive !== false,
    categoryId: item.categoryId,
    question: item.question,
    answer: item.answer,
  };
}

export function FaqItemsEditor() {
  const sections = useFaqSections();
  const { items } = sections;
  const params = useSearchParams();
  const { pathname, router } = useFaqNav();
  const questionParam = params.get("question");
  const editing = questionParam !== null;
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const existing = items.find((item) => item.id === questionParam) ?? null;

  function close() {
    markReturn();
    setFaqQuery(router, pathname, "question", null);
  }

  function save(draft: Draft) {
    const doc = readFaqSections();
    const next: FaqQuestion = {
      id: draft.id,
      isActive: draft.isActive,
      categoryId: draft.categoryId,
      question: draft.question.trim(),
      answer: draft.answer.trim(),
    };
    const itemsNext = doc.items.some((item) => item.id === next.id)
      ? doc.items.map((item) => (item.id === next.id ? next : item))
      : [...doc.items, next];
    saveFaqSections({ ...doc, items: itemsNext });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    close();
  }

  function remove(id: string) {
    const doc = readFaqSections();
    saveFaqSections({ ...doc, items: doc.items.filter((item) => item.id !== id) });
    setNotice("Removed.");
    window.setTimeout(() => setNotice(""), 1600);
    close();
  }

  function move(index: number, direction: -1 | 1) {
    const doc = readFaqSections();
    saveFaqSections({ ...doc, items: moveList(doc.items, index, direction) });
  }

  const formItem =
    questionParam === "new"
      ? blankFaqQuestion(sections.categories.items[0]?.id ?? "")
      : existing;

  return (
    <div className="min-w-0 space-y-4">
      <FaqHeader
        sectionId="items"
        title="Questions"
        description="Each question and answer."
        editLabel="Add question"
        onEdit={() => setFaqQuery(router, pathname, "question", "new")}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} The question list is up to date.
        </p>
      ) : null}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-neutral-200/90">
          <p className="text-sm font-semibold text-neutral-950">No questions yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            Add the first question. It shows on the FAQ page when it is active.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/90 sm:flex-row sm:items-center",
                item.isActive === false && "opacity-60",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-neutral-950">
                    {item.question || "Untitled"}
                  </p>
                  <VisibilityBadge active={item.isActive !== false} />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {faqCategoryLabel(sections, item.categoryId) || "No category"}
                  {item.isActive === false ? " · Hidden" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <MoveButton
                  label="Move question earlier"
                  icon="arrow_upward"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                />
                <MoveButton
                  label="Move question later"
                  icon="arrow_downward"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                />
                <button
                  type="button"
                  onClick={() => setFaqQuery(router, pathname, "question", item.id)}
                  className={adminButtonClass.secondary}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {formItem ? (
        <QuestionForm
          key={questionParam ?? formItem.id}
          item={formItem}
          isNew={questionParam === "new"}
          onClose={close}
          onSave={save}
          onRemove={questionParam === "new" ? undefined : () => remove(formItem.id)}
        />
      ) : null}
    </div>
  );
}

function QuestionForm({
  item,
  isNew,
  onClose,
  onSave,
  onRemove,
}: {
  item: FaqQuestion;
  isNew: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => void;
  onRemove?: () => void;
}) {
  const { categories } = useFaqSections();
  const initial = draftFrom(item);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();
  const options = categories.items.slice();
  if (draft.categoryId && !options.some((category) => category.id === draft.categoryId)) {
    options.unshift({ id: draft.categoryId, label: "Unknown category", icon: "help" });
  }

  function save() {
    if (saving) return;
    if (!draft.question.trim()) {
      setError("Question is required.");
      return;
    }
    if (!draft.answer.trim()) {
      setError("Answer is required.");
      return;
    }
    if (!draft.categoryId) {
      setError("Choose a category.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <FaqModal
        titleId="faq-question-modal-title"
        title={isNew ? "Add question" : "Edit question"}
        description="Shown in the FAQ list for its category."
        saving={saving}
        saveLabel={isNew ? "Add question" : "Save changes"}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <div>
          <FieldLabel htmlFor={`${formId}-category`}>Category *</FieldLabel>
          <select
            id={`${formId}-category`}
            value={draft.categoryId}
            onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
            className={adminFieldClass}
          >
            {options.length === 0 ? (
              <option value="">Add a category first</option>
            ) : (
              options.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label || "Untitled"}
                </option>
              ))
            )}
          </select>
        </div>
        <Labeled
          id={`${formId}-question`}
          label="Question"
          required
          value={draft.question}
          invalid={error === "Question is required."}
          onChange={(question) => {
            setDraft({ ...draft, question });
            setError("");
          }}
        />
        <Labeled
          id={`${formId}-answer`}
          label="Answer"
          required
          value={draft.answer}
          multiline
          invalid={error === "Answer is required."}
          onChange={(answer) => {
            setDraft({ ...draft, answer });
            setError("");
          }}
        />
        <FormError message={error} />
        {onRemove ? (
          <button type="button" onClick={onRemove} className="text-sm font-medium text-red-600 hover:underline">
            Remove question
          </button>
        ) : null}
      </FaqModal>
    </FormCloseGuard>
  );
}

function MoveButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-30"
    >
      <MaterialIcon name={icon} className="text-[18px]" />
    </button>
  );
}
