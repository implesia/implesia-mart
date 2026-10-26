"use client";

import { useId, useMemo, useState } from "react";

import {
  blankCategoryDraft,
  createCategory,
  type CategoryTile,
} from "@/lib/mart-api/categories";
import { defaultParentId, parentChoices } from "@/lib/mart-api/category-tree";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { adminButtonClass } from "../../_components/admin-ui";

const NAME_MAX = 120;

const fieldClass =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

/**
 * Creates a category (optionally under a parent) without leaving the product form. It reuses
 * the admin category endpoint, so name rules, sibling-name uniqueness and the depth limit are
 * enforced by the API; this only reports its answer.
 */
export function CategoryQuickCreate({
  items,
  selectedId,
  onCreated,
  onCancel,
}: {
  items: CategoryTile[];
  /** The product's current category; a new category starts under it when it can. */
  selectedId: string;
  onCreated: (tile: CategoryTile) => void;
  /** Omitted when there is nothing else to do (no categories yet). */
  onCancel?: () => void;
}) {
  const baseId = useId();
  const choices = useMemo(() => parentChoices(items), [items]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(() => defaultParentId(choices, selectedId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (saving) return;
    const label = name.trim();
    if (!label) {
      setError("Enter a category name.");
      return;
    }
    if (label.length > NAME_MAX) {
      setError(`Use ${NAME_MAX} characters or fewer.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const tile = await createCategory({ ...blankCategoryDraft(parentId || null), label });
      onCreated(tile);
    } catch (failure) {
      setError(
        failure instanceof MartApiError
          ? failure.message
          : "Could not create the category. Check your connection and try again.",
      );
      setSaving(false);
    }
  }

  const nameId = `${baseId}-name`;
  const errorId = `${baseId}-error`;

  return (
    <div
      role="group"
      aria-label="New category"
      className="grid gap-3 border-l-2 border-neutral-200 pl-3 sm:grid-cols-2"
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          void submit();
        }
      }}
    >
      <div>
        <label htmlFor={nameId} className="mb-1.5 block text-xs font-medium text-neutral-600">
          New category name <span className="text-red-700">*</span>
        </label>
        <input
          id={nameId}
          value={name}
          maxLength={NAME_MAX}
          placeholder="Trending gadgets"
          disabled={saving}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(fieldClass, error && "border-red-400")}
        />
      </div>
      <div>
        <label
          htmlFor={`${baseId}-parent`}
          className="mb-1.5 block text-xs font-medium text-neutral-600"
        >
          Parent category
        </label>
        <select
          id={`${baseId}-parent`}
          value={parentId}
          disabled={saving}
          onChange={(event) => setParentId(event.target.value)}
          className={fieldClass}
        >
          <option value="">None (top level)</option>
          {choices.map((choice) => (
            <option key={choice.id} value={choice.id} disabled={choice.disabled}>
              {`${"\u00a0\u00a0".repeat(choice.depth)}${choice.depth > 0 ? "└ " : ""}${choice.label}${choice.hidden ? " (hidden)" : ""}`}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-700 sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          aria-busy={saving || undefined}
          className={cn(adminButtonClass.primary, "h-11 px-5")}
        >
          {saving ? "Creating…" : "Create and select"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={cn(adminButtonClass.secondary, "h-11 px-5")}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
