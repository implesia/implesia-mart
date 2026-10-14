"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { getFaqCategories, type FaqCategories, type FaqCategory } from "@/lib/mart-api/faq-categories";
import {
  createFaqItem,
  deleteFaqItem,
  getFaqItems,
  reorderFaqItems,
  updateFaqItem,
  type FaqItem,
} from "@/lib/mart-api/faq-items";
import { moveList } from "@/lib/mart-mock/faq-sections";
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

function draftFrom(item: FaqItem): Draft {
  return {
    id: item.id,
    isActive: item.isActive !== false,
    categoryId: item.categoryId,
    question: item.question,
    answer: item.answer,
  };
}

function categoryLabel(categories: FaqCategories | null, id: string) {
  return categories?.items.find((item) => item.id === id)?.label ?? "";
}

export function FaqItemsEditor() {
  const [items, setItems] = useState<FaqItem[] | null>(null);
  const [categories, setCategories] = useState<FaqCategories | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useFaqNav();
  const questionParam = params.get("question");
  const editing = questionParam !== null;
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const existing = items?.find((item) => item.id === questionParam) ?? null;

  useEffect(() => {
    let active = true;
    getFaqItems()
      .then((next) => {
        if (active) setItems(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the questions.");
        }
      });
    getFaqCategories()
      .then((next) => {
        if (active) setCategories(next);
      })
      .catch(() => {
        if (active) setCategories(null);
      });
    return () => {
      active = false;
    };
  }, []);

  function close() {
    markReturn();
    setFaqQuery(router, pathname, "question", null);
  }

  async function save(draft: Draft) {
    const payload = {
      isActive: draft.isActive,
      categoryId: draft.categoryId,
      question: draft.question.trim(),
      answer: draft.answer.trim(),
    };
    if (questionParam === "new") {
      const created = await createFaqItem(payload);
      setItems((current) => [...(current ?? []), created]);
    } else {
      const saved = await updateFaqItem({ id: draft.id, ...payload });
      setItems((current) => (current ?? []).map((item) => (item.id === saved.id ? saved : item)));
    }
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    close();
  }

  async function remove(id: string) {
    await deleteFaqItem(id);
    setItems((current) => (current ?? []).filter((item) => item.id !== id));
    setNotice("Removed.");
    window.setTimeout(() => setNotice(""), 1600);
    close();
  }

  async function move(index: number, direction: -1 | 1) {
    if (!items) return;
    const next = moveList(items, index, direction);
    if (next === items) return;
    setItems(next);
    try {
      setItems(await reorderFaqItems(next.map((item) => item.id)));
    } catch (error: unknown) {
      setItems(items);
      setNotice(error instanceof Error ? error.message : "Could not reorder the questions.");
    }
  }

  const formItem =
    questionParam === "new"
      ? {
          id: "new",
          isActive: true,
          categoryId: categories?.items[0]?.id ?? "",
          question: "",
          answer: "",
        }
      : existing;

  if (!items) {
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
        <p className="text-sm text-neutral-600">{loadError || "Loading the questions…"}</p>
      </div>
    );
  }

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
                  {categoryLabel(categories, item.categoryId) || "No category"}
                  {item.isActive === false ? " · Hidden" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <MoveButton
                  label="Move question earlier"
                  icon="arrow_upward"
                  disabled={index === 0}
                  onClick={() => void move(index, -1)}
                />
                <MoveButton
                  label="Move question later"
                  icon="arrow_downward"
                  disabled={index === items.length - 1}
                  onClick={() => void move(index, 1)}
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
          categories={categories?.items ?? []}
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
  categories,
  onClose,
  onSave,
  onRemove,
}: {
  item: FaqItem;
  isNew: boolean;
  categories: FaqCategory[];
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
}) {
  const initial = draftFrom(item);
  const [rawDraft, setDraft] = useState(initial);
  // A new item defaults to the first category until the editor picks one.
  const firstCategory = isNew ? categories[0]?.id : undefined;
  const draft =
    firstCategory && !rawDraft.categoryId ? { ...rawDraft, categoryId: firstCategory } : rawDraft;
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();
  const options = categories.slice();
  if (draft.categoryId && !options.some((category) => category.id === draft.categoryId)) {
    options.unshift({ id: draft.categoryId, label: "Unknown category", icon: "help", isActive: true });
  }


  async function save() {
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
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the question.");
    }
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
          <button
            type="button"
            onClick={() => void onRemove()}
            className="text-sm font-medium text-red-600 hover:underline"
          >
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
