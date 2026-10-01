"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankBlogCategory,
  moveList,
  readBlogSections,
  saveBlogSections,
  type BlogCategoriesContent,
  type BlogCategoryItem,
} from "@/lib/mart-mock/blog-sections";
import { useBlogSections } from "@/lib/mart-mock/hooks";
import { cn } from "@/lib/utils";

import {
  ActiveStatusField,
  adminButtonClass,
} from "../../../_components/admin-ui";
import { FormCloseGuard } from "../../../_components/form-close-guard";
import {
  BlogCard,
  BlogHeader,
  BlogModal,
  FormError,
  ItemToolbar,
  Labeled,
  setBlogQuery,
  useBlogNav,
  useReturnFocus,
  VisibilitySwitch,
} from "./blog-shared";

type Draft = {
  isActive: boolean;
  items: BlogCategoryItem[];
};

function draftFrom(categories: BlogCategoriesContent): Draft {
  return {
    isActive: categories.isActive !== false,
    items: categories.items.map((item) => ({
      ...item,
      isActive: item.isActive !== false,
    })),
  };
}

export function BlogCategoriesEditor() {
  const { categories } = useBlogSections();
  const params = useSearchParams();
  const { pathname, router } = useBlogNav();
  const editing = params.get("edit") === "categories";
  const [notice, setNotice] = useState("");
  const { focusEdit, markReturn } = useReturnFocus(editing);
  const empty = categories.items.length === 0;

  function setEditing(open: boolean) {
    if (!open) markReturn();
    setBlogQuery(router, pathname, "edit", open ? "categories" : null);
  }

  function save(draft: Draft) {
    const doc = readBlogSections();
    saveBlogSections({
      ...doc,
      categories: {
        isActive: draft.isActive,
        items: draft.items.map((item) => ({
          id: item.id,
          label: item.label.trim(),
          isActive: item.isActive !== false,
        })),
      },
    });
    setNotice("Saved.");
    window.setTimeout(() => setNotice(""), 1600);
    setEditing(false);
  }

  return (
    <div className="min-w-0 space-y-4">
      <BlogHeader
        sectionId="categories"
        title="Categories"
        description="Filter tags on the blog list."
        editLabel="Edit categories"
        onEdit={() => setEditing(true)}
        editRef={focusEdit}
      />
      {notice ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice} This section is up to date.
        </p>
      ) : null}
      <BlogCard
        headingId="blog-categories-card"
        title="Categories"
        description={
          categories.isActive === false
            ? "Filters are hidden. Articles still show under All."
            : "These chips filter the blog list. Hidden chips stay off the site."
        }
        active={categories.isActive !== false}
        empty={empty}
        emptyTitle="No categories yet"
        emptyBody="Add the filters readers use on the blog list."
      >
        <ul className="flex flex-wrap gap-2">
          {categories.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-full bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 ring-1 ring-neutral-200",
                item.isActive === false && "opacity-50",
              )}
            >
              {item.label || "Category"}
              {item.isActive === false ? " · Hidden" : ""}
            </li>
          ))}
        </ul>
      </BlogCard>
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
  categories: BlogCategoriesContent;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const initial = draftFrom(categories);
  const [draft, setDraft] = useState(initial);
  const [baseline] = useState(initial);
  const [itemError, setItemError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();

  function save() {
    if (saving) return;
    if (draft.items.some((item) => !item.label.trim())) {
      setItemError("Every category needs a name.");
      return;
    }
    setSaving(true);
    onSave(draft);
  }

  return (
    <FormCloseGuard baseline={baseline} value={draft} onClose={onClose}>
      <BlogModal
        titleId="blog-categories-modal-title"
        title="Edit categories"
        description="Readers use these to filter the blog list."
        saving={saving}
        onClose={onClose}
        onSave={save}
      >
        <ActiveStatusField
          checked={draft.isActive}
          onChange={(isActive) => setDraft({ ...draft, isActive })}
        />
        <p className="text-sm text-neutral-500">
          Turning this off hides the filter chips. Articles stay on the list.
          Removing a category does not delete its articles.
        </p>
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
                      items: current.items.filter(
                        (category) => category.id !== item.id,
                      ),
                    }))
                  }
                />
                <Labeled
                  id={`${formId}-${item.id}`}
                  label="Name"
                  required
                  value={item.label}
                  invalid={Boolean(itemError && !item.label.trim())}
                  onChange={(label) => {
                    setDraft((current) => ({
                      ...current,
                      items: current.items.map((category) =>
                        category.id === item.id
                          ? { ...category, label }
                          : category,
                      ),
                    }));
                    setItemError("");
                  }}
                />
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
                        category.id === item.id
                          ? { ...category, isActive }
                          : category,
                      ),
                    }))
                  }
                />
              </li>
            ))}
          </ul>
        )}
        <FormError message={itemError} />
        <button
          type="button"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              items: [...current.items, blankBlogCategory()],
            }))
          }
          className={adminButtonClass.secondary}
        >
          <MaterialIcon name="add" className="text-[18px]" />
          Add category
        </button>
      </BlogModal>
    </FormCloseGuard>
  );
}
