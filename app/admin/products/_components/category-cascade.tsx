"use client";

import { useEffect, useId, useMemo, useState } from "react";

import {
  listAdminCategories,
  type CategoryTile,
} from "@/lib/mart-api/categories";
import { cascadeLevels, cascadeSelect } from "@/lib/mart-api/category-tree";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";

import { adminButtonClass } from "../../_components/admin-ui";
import { CategoryQuickCreate } from "./category-quick-create";

const LEVEL_LABEL = ["Category", "Subcategory", "Sub-subcategory"];

const fieldClass =
  "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function levelLabel(index: number) {
  return LEVEL_LABEL[index] ?? `Level ${index + 1} category`;
}

/**
 * Parent > child > grandchild selects backed by the admin category list. The value is the id
 * of the deepest chosen node (a product may sit at any level); clearing a select steps back
 * to its parent. `onChange` also reports the readable path for previews.
 */
export function CategoryCascade({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (id: string, trail: string) => void;
  error?: string;
}) {
  const baseId = useId();
  const [items, setItems] = useState<CategoryTile[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    listAdminCategories()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        setLoadError(
          failure instanceof MartApiError ? failure.message : "Could not load categories.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const levels = useMemo(() => (items ? cascadeLevels(items, value) : []), [items, value]);

  // Report the readable path once the list arrives or the selection changes elsewhere.
  const trail = useMemo(() => {
    if (!items || !value) return "";
    return items.find((item) => item.id === value)?.path.map((node) => node.name).join(" › ") ?? "";
  }, [items, value]);
  useEffect(() => {
    if (trail) onChange(value, trail);
    // onChange identity is not stable; the trail text is the only thing worth reporting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail]);

  if (loadError) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
        {loadError}
      </p>
    );
  }
  if (!items) {
    return <div className="h-11 animate-pulse rounded-xl bg-neutral-100" aria-busy="true" />;
  }
  // A category made here joins the list at once and becomes the product's category.
  const created = (tile: CategoryTile) => {
    setItems((current) => [...(current ?? []), tile]);
    setCreating(false);
    setNotice(`Created “${tile.label}” and selected it.`);
    onChange(tile.id, tile.path.map((node) => node.name).join(" › "));
  };

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-600">
          There are no categories yet. Create the first one here; the product will be placed in it.
        </p>
        <CategoryQuickCreate items={items} selectedId="" onCreated={created} />
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {levels.map((level, index) => {
          const id = `${baseId}-${index}`;
          return (
            <div key={level.parentId ?? "root"}>
              <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-neutral-600">
                {levelLabel(index)}
                {index === 0 ? <span className="text-red-700"> *</span> : null}
              </label>
              <select
                id={id}
                value={level.value}
                aria-invalid={index === 0 && error ? true : undefined}
                onChange={(event) => {
                  setNotice("");
                  const next = cascadeSelect(level.parentId, event.target.value);
                  const row = items.find((item) => item.id === next);
                  onChange(next, row?.path.map((node) => node.name).join(" › ") ?? "");
                }}
                className={cn(fieldClass, index === 0 && error && "border-red-400")}
              >
                <option value="">{index === 0 ? "Choose a category" : "None (keep above)"}</option>
                {level.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                    {option.isActive ? "" : " (hidden)"}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
        {error ? (
          <p role="alert" className="text-sm text-red-700 sm:col-span-3">
            {error}
          </p>
        ) : null}
      </div>
      {creating ? (
        <CategoryQuickCreate
          items={items}
          selectedId={value}
          onCreated={created}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setNotice("");
            setCreating(true);
          }}
          className={cn(adminButtonClass.quiet, "h-11 -ml-3")}
        >
          + New category
        </button>
      )}
      <p role="status" className="text-sm text-emerald-800 empty:hidden">
        {notice}
      </p>
    </div>
  );
}
