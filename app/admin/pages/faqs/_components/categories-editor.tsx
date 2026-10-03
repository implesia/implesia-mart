"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  getFaqCategories,
  saveFaqCategories,
  type FaqCategories,
  type FaqCategory,
} from "@/lib/mart-api/faq-categories";
import { blankFaqCategory, moveList } from "@/lib/mart-mock/faq-sections";
import { cn } from "@/lib/utils";

import { ActiveStatusField, adminButtonClass } from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  FaqCard,
  FaqHeader,
  FaqIconPicker,
  FaqModal,
  FormError,
  ItemToolbar,
  Labeled,
  setFaqQuery,
  useFaqNav,
  useReturnFocus,
  VisibilitySwitch,
} from "./faq-shared";

type Draft = {
  isActive: boolean;
  title: string;
  subtitle: string;
  allLabel: string;
  allIcon: string;
  navLabel: string;
  items: FaqCategory[];
};

function draftFrom(categories: FaqCategories): Draft {
  return {
    isActive: categories.isActive !== false,
    title: categories.title,
    subtitle: categories.subtitle,
    allLabel: categories.allLabel,
    allIcon: categories.allIcon,
    navLabel: categories.navLabel,
    items: categories.items.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

export function FaqCategoriesEditor() {
  const [categories, setCategories] = useState<FaqCategories | null>(null);
  const [loadError, setLoadError] = useState("");
  const params = useSearchParams();
  const { pathname, router } = useFaqNav();
  const editing = params.get("edit") === "categories";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);

  useEffect(() => {
    let active = true;
    getFaqCategories()
      .then((next) => {
        if (active) setCategories(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load the categories.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setFaqQuery(router, pathname, "edit", open ? "categories" : null);
  }

  async function save(draft: Draft) {
    const saved = await saveFaqCategories({
      isActive: draft.isActive,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      allLabel: draft.allLabel.trim(),
      allIcon: draft.allIcon.trim(),
      navLabel: draft.navLabel.trim(),
      items: draft.items.map((item) => ({
        id: item.id,
        label: item.label.trim(),
        icon: item.icon.trim(),
        isActive: item.isActive !== false,
      })),
    });
    setCategories(saved);
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  if (!categories) {
    return (
      <div className="min-w-0 space-y-4">
        <FaqHeader
          sectionId="categories"
          title="Categories"
          description="Sidebar topic groups."
          editLabel="Edit categories"
          onEdit={() => setEditing(true)}
          editRef={focusEdit}
        />
        <p className="text-sm text-neutral-600">{loadError || "Loading the categories…"}</p>
      </div>
    );
  }

  const empty =
    !categories.title.trim() &&
    !categories.subtitle.trim() &&
    !categories.allLabel.trim() &&
    !categories.navLabel.trim() &&
    categories.items.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      <FaqHeader
        sectionId="categories"
        title="Categories"
        description="Sidebar topic groups."
        editLabel="Edit categories"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <FaqCard
        headingId="faq-categories-card"
        title="Categories"
        description={
          categories.isActive === false
            ? "The sidebar is hidden. Questions still show."
            : "Shown beside the questions. Hidden topics stay off the sidebar."
        }
        active={categories.isActive !== false}
        empty={empty}
        emptyTitle="No categories yet"
        emptyBody="Add the sidebar topics for the FAQ page."
      >
        <div className="rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
          <p className="px-2 text-sm font-semibold text-neutral-950">
            {categories.title.trim() || "Categories"}
          </p>
          <p className="px-2 text-xs text-neutral-500">{categories.subtitle}</p>
          <ul className="mt-2 space-y-1">
            <li className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-neutral-950">
              <MaterialIcon name={categories.allIcon || "grid_view"} className="text-[18px]" />
              {categories.allLabel.trim() || "All"}
            </li>
            {categories.items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-neutral-800",
                  item.isActive === false && "opacity-50",
                )}
              >
                <MaterialIcon name={item.icon || "help"} className="text-[18px]" />
                {item.label || "Category"}
                {item.isActive === false ? " · Hidden" : ""}
              </li>
            ))}
          </ul>
        </div>
      </FaqCard>
      {editing ? (
        <CategoriesForm
          categories={categories}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function CategoriesForm({
  categories,
  onClose,
  onSave,
}: {
  categories: FaqCategories;
  onClose: () => void;
  onSave: (draft: Draft) => void | Promise<void>;
}) {
  const initial = draftFrom(categories);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  async function save() {
    if (saving) return;
    if (draft.items.length > 12) {
      setError("You can add up to 12 categories.");
      return;
    }
    if (draft.items.some((item) => !item.label.trim())) {
      setError("Every category needs a name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught) {
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Could not save the categories.");
    }
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <FaqModal
        titleId="faq-categories-modal-title"
        title="Edit categories"
        description="Topics in the sidebar. Removing a topic does not delete its questions."
        size="lg"
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled
            id={`${formId}-title`}
            label="Sidebar title"
            value={draft.title}
            onChange={(title) => setDraft({ ...draft, title })}
          />
          <Labeled
            id={`${formId}-subtitle`}
            label="Sidebar subtitle"
            value={draft.subtitle}
            onChange={(subtitle) => setDraft({ ...draft, subtitle })}
          />
          <Labeled
            id={`${formId}-all`}
            label="All questions label"
            value={draft.allLabel}
            onChange={(allLabel) => setDraft({ ...draft, allLabel })}
          />
          <Labeled
            id={`${formId}-nav`}
            label="Sidebar label"
            value={draft.navLabel}
            onChange={(navLabel) => setDraft({ ...draft, navLabel })}
          />
        </div>
        <FaqIconPicker
          value={draft.allIcon}
          onChange={(allIcon) => setDraft({ ...draft, allIcon })}
        />
        {draft.items.length === 0 ? (
          <p className="rounded-2xl bg-admin-canvas px-4 py-8 text-center text-sm text-neutral-500">
            No categories yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {draft.items.map((item, index) => (
              <li key={item.id} className="rounded-2xl bg-admin-canvas p-3">
                <ItemToolbar
                  index={index}
                  total={draft.items.length}
                  noun="Category"
                  onMove={(direction) =>
                    setDraft((current) => ({
                      ...current,
                      items: moveList(current.items, index, direction),
                    }))
                  }
                  onRemove={() =>
                    setDraft((current) => ({
                      ...current,
                      items: current.items.filter((category) => category.id !== item.id),
                    }))
                  }
                />
                <Labeled
                  id={`${formId}-${item.id}`}
                  label="Name"
                  required
                  value={item.label}
                  invalid={Boolean(error && !item.label.trim())}
                  onChange={(label) => {
                    setDraft((current) => ({
                      ...current,
                      items: current.items.map((category) =>
                        category.id === item.id ? { ...category, label } : category,
                      ),
                    }));
                    setError("");
                  }}
                />
                <div className="mt-3">
                  <FaqIconPicker
                    value={item.icon}
                    onChange={(icon) =>
                      setDraft((current) => ({
                        ...current,
                        items: current.items.map((category) =>
                          category.id === item.id ? { ...category, icon } : category,
                        ),
                      }))
                    }
                  />
                </div>
                <VisibilitySwitch
                  checked={item.isActive !== false}
                  label={
                    item.isActive !== false
                      ? `Hide category ${index + 1}`
                      : `Show category ${index + 1}`
                  }
                  onChange={(isActive) =>
                    setDraft((current) => ({
                      ...current,
                      items: current.items.map((category) =>
                        category.id === item.id ? { ...category, isActive } : category,
                      ),
                    }))
                  }
                />
              </li>
            ))}
          </ul>
        )}
        <FormError message={error} />
        <button
          type="button"
          disabled={draft.items.length >= 12}
          onClick={() =>
            setDraft((current) =>
              current.items.length >= 12
                ? current
                : { ...current, items: [...current.items, blankFaqCategory()] },
            )
          }
          className={adminButtonClass.secondary}
        >
          <MaterialIcon name="add" className="text-[18px]" />
          Add category
        </button>
      </FaqModal>
    </FormCloseGuard>
  );
}
