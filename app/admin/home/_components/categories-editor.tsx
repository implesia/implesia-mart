"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankCategoryDraft,
  categoryImage,
  createCategoryTile,
  deleteCategoryTile,
  getCategorySection,
  reorderCategoryTiles,
  updateCategoryHeading,
  updateCategoryTile,
  type CategoryDraft,
  type CategorySection,
  type CategoryTile,
} from "@/lib/mart-api/categories";
import {
  buildCategoryTree,
  flattenCategoryTree,
  moveAmongSiblings,
  selfAndDescendantIds,
} from "@/lib/mart-api/category-tree";
import { MartApiError } from "@/lib/mart-api/products";
import { cn } from "@/lib/utils";
import { isContentActive } from "@/lib/mart-mock/visibility";

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
import { ImageField } from "../../_components/image-field";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

export function CategoryTiles() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selected = params.get("edit");
  const creating = selected === "new";
  const [section, setSection] = useState<CategorySection | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [baseline, setBaseline] = useState<CategoryDraft | null>(null);
  const [labelError, setLabelError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const labelId = useId();
  const tiles = useMemo(() => section?.tiles ?? [], [section]);
  // Admin list and parent picker follow the tree (hidden tiles included), depth-first.
  const treeRows = useMemo(
    () => flattenCategoryTree(buildCategoryTree(tiles, { includeHidden: true })),
    [tiles],
  );

  useEffect(() => {
    let cancelled = false;
    getCategorySection()
      .then((next) => {
        if (!cancelled) setSection(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof MartApiError ? error.message : "Could not load categories.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if ((selected === null || selected === "new" || section) && selected !== openKey) {
    setOpenKey(selected);
    setResolved(selected);
    setLabelError("");
    setFormError("");
    if (!selected) {
      setDraft(null);
      setBaseline(null);
    } else if (selected === "new") {
      const next = blankCategoryDraft();
      setDraft(next);
      setBaseline(next);
    } else {
      const tile = section?.tiles.find((entry) => entry.id === selected);
      const next = tile ? draftFrom(tile) : null;
      setDraft(next);
      setBaseline(next);
    }
  }

  useEffect(() => {
    if (draft || !focusId.current) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(`category-${id}`)?.focus();
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

  async function saveHeading(heading: string) {
    if (!section) return;
    setSection(await updateCategoryHeading(heading));
  }

  async function save() {
    if (!draft || saving || uploading || !section) return;
    const label = draft.label.trim();
    if (!label) {
      setLabelError("Label is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const nextDraft = { ...draft, label, href: draft.href.trim() };
    try {
      if (creating) {
        const created = await createCategoryTile(nextDraft);
        setSection({ ...section, tiles: [...section.tiles, created] });
        setSavedId(created.id);
        focusId.current = created.id;
      } else if (selected) {
        const previousParentId =
          section.tiles.find((entry) => entry.id === selected)?.parentId ?? null;
        const updated = await updateCategoryTile(selected, nextDraft, previousParentId);
        setSection({
          ...section,
          tiles: section.tiles.map((entry) => (entry.id === selected ? updated : entry)),
        });
        setSavedId(selected);
        focusId.current = selected;
      }
      setSaving(false);
      flash("Saved");
      setEdit(null);
    } catch (error) {
      setSaving(false);
      setFormError(error instanceof MartApiError ? error.message : "Could not save the category.");
    }
  }

  async function remove(id: string) {
    if (!section) return;
    try {
      await deleteCategoryTile(id);
      setSection({ ...section, tiles: section.tiles.filter((tile) => tile.id !== id) });
      if (selected === id) setEdit(null);
      setConfirmId(null);
      flash("Removed");
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not remove the category.");
    }
  }

  async function move(id: string, direction: -1 | 1) {
    if (!section) return;
    setLoadError("");
    const order = moveAmongSiblings(section.tiles, id, direction);
    if (!order) return;
    try {
      setSection(await reorderCategoryTiles(order));
    } catch (error) {
      setLoadError(
        error instanceof MartApiError ? error.message : "Could not reorder the categories.",
      );
    }
  }

  async function dropOn(targetId: string) {
    if (!dragId || dragId === targetId || !section) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const dragged = section.tiles.find((tile) => tile.id === dragId);
    const target = section.tiles.find((tile) => tile.id === targetId);
    setDragId(null);
    setOverId(null);
    setLoadError("");
    if (!dragged || !target) return;
    if ((dragged.parentId ?? null) !== (target.parentId ?? null)) {
      setLoadError("Drag within the same parent. Change the parent in Edit to move a category.");
      return;
    }
    // Reorder the siblings, then send the whole tree depth-first.
    const siblings = section.tiles.filter(
      (tile) => (tile.parentId ?? null) === (dragged.parentId ?? null),
    );
    const from = siblings.findIndex((tile) => tile.id === dragged.id);
    const to = siblings.findIndex((tile) => tile.id === target.id);
    siblings.splice(to, 0, ...siblings.splice(from, 1));
    const rank = new Map(siblings.map((tile, index) => [tile.id, index]));
    const reordered = [...section.tiles].sort(
      (a, b) => (rank.get(a.id) ?? -1) - (rank.get(b.id) ?? -1),
    );
    const order = flattenCategoryTree(buildCategoryTree(reordered, { includeHidden: true })).map(
      (node) => node.item.id,
    );
    try {
      setSection(await reorderCategoryTiles(order));
    } catch (error) {
      setLoadError(
        error instanceof MartApiError ? error.message : "Could not reorder the categories.",
      );
    }
  }

  if (!section && !loadError) {
    return <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />;
  }
  if (!section) {
    return (
      <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-red-700 ring-1 ring-red-100">
        {loadError}
      </p>
    );
  }

  const missing = Boolean(selected && selected !== "new" && resolved === selected && !draft);
  const visibleTree = buildCategoryTree(tiles);
  const visible = visibleTree.map((node) => node.item);
  const childCount = new Map(visibleTree.map((node) => [node.item.id, node.children.length]));
  const parentOptions = treeRows.filter(
    (row) => !(selected && selected !== "new" && selfAndDescendantIds(tiles, selected).has(row.item.id)),
  );
  const labelOf = new Map(tiles.map((tile) => [tile.id, tile.label || "Untitled category"]));

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Categories"
        description="Manage the category tiles displayed on your storefront."
        sectionId="categories"
        extra={
          <button type="button" onClick={() => setEdit("new")} className={adminButtonClass.primary}>
            <MaterialIcon name="add" className="text-[18px]" />
            Add category
          </button>
        }
      />

      {loadError ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      ) : null}
      {notice && !draft ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. The category list is up to date.
        </p>
      ) : null}
      {missing ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/90">
          This category is no longer here.{" "}
          <button type="button" onClick={() => setEdit(null)} className="font-medium text-primary">
            Close
          </button>
        </p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl bg-[#f5f6f8] ring-1 ring-neutral-200/90"
        aria-labelledby="category-preview-heading"
      >
        <div className="px-4 pt-4 sm:px-5">
          <h2 id="category-preview-heading" className="text-sm font-semibold text-neutral-950">
            Storefront preview
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Top-level categories as shown on the home page, in this order. Subcategories open from
            them in the hero menu. Hidden categories (and everything under them) stay off the home page.
          </p>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 sm:px-6 sm:py-5">
            <SectionCopyForm
              values={{ heading: section.heading }}
              fields={[{ name: "heading", label: "Heading", wide: true }]}
              saveLabel="Save heading"
              onSave={(next) => saveHeading(next.heading ?? "")}
            />
            {visible.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <p className="text-sm font-semibold text-neutral-950">
                  {tiles.length === 0 ? "No categories yet" : "All categories are hidden."}
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                  Add a category tile so customers can open a collection from the home page.
                </p>
                {tiles.length === 0 ? (
                  <button type="button" onClick={() => setEdit("new")} className={cn(adminButtonClass.primary, "mt-4")}>
                    <MaterialIcon name="add" className="text-[18px]" />
                    Add category
                  </button>
                ) : null}
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                {visible.map((tile) => (
                  <li key={tile.id}>
                    <button
                      type="button"
                      onClick={() => setEdit(tile.id)}
                      className={cn(
                        "relative flex min-h-32 w-full overflow-hidden rounded-2xl text-left sm:min-h-56",
                        selected === tile.id && "ring-2 ring-primary",
                      )}
                    >
                      {tile.imageSrc ? (
                        <Image
                          src={categoryImage(tile.imageSrc)}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, 40vw"
                          className="object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 bg-neutral-800" />
                      )}
                      <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/10" />
                      <span className="relative z-10 mt-auto px-3 py-3 text-sm font-semibold text-white sm:px-5 sm:py-5 sm:text-2xl">
                        {tile.label || "Untitled category"}
                        {childCount.get(tile.id) ? (
                          <span className="mt-0.5 block text-xs font-medium text-white/80 sm:text-sm">
                            {childCount.get(tile.id)} subcategor{childCount.get(tile.id) === 1 ? "y" : "ies"}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {tiles.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90" aria-labelledby="category-list-heading">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h2 id="category-list-heading" className="text-sm font-semibold text-neutral-950">
              {tiles.length === 1 ? "1 category" : `${tiles.length} categories`}
            </h2>
          </div>
          <ol>
            {treeRows.map(({ item: tile, depth }, index) => {
              const siblings = tiles.filter(
                (entry) => (entry.parentId ?? null) === (tile.parentId ?? null),
              );
              const siblingIndex = siblings.findIndex((entry) => entry.id === tile.id);
              return (
              <li
                key={tile.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(tile.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void dropOn(tile.id);
                }}
                className={cn(
                  "border-t border-neutral-100 first:border-t-0",
                  selected === tile.id && "bg-primary/5",
                  savedId === tile.id && "bg-emerald-50",
                  overId === tile.id && dragId && dragId !== tile.id && "bg-primary/10",
                  dragId === tile.id && "opacity-60",
                )}
              >
                <div
                  className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4"
                  style={{ paddingLeft: `calc(${depth} * 1.5rem + 0.75rem)` }}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      draggable
                      aria-label={`Reorder ${tile.label || "category"}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", tile.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDragId(tile.id);
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
                      id={`category-${tile.id}`}
                      type="button"
                      onClick={() => setEdit(tile.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">{index + 1}</span>
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {tile.imageSrc ? (
                          <Image src={categoryImage(tile.imageSrc)} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-neutral-400">
                            <MaterialIcon name="image" className="text-[18px]" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-neutral-950">{tile.label || "Untitled category"}</span>
                          <VisibilityBadge active={isContentActive(tile)} />
                        </span>
                        <span className="block truncate text-xs text-neutral-500">
                          {depth > 0 && tile.parentId ? `in ${labelOf.get(tile.parentId)} · ` : ""}
                          {tile.href || "/products"}
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <IconButton label="Move earlier" icon="arrow_upward" disabled={siblingIndex <= 0} onClick={() => void move(tile.id, -1)} />
                    <IconButton label="Move later" icon="arrow_downward" disabled={siblingIndex === siblings.length - 1} onClick={() => void move(tile.id, 1)} />
                    <button type="button" onClick={() => setEdit(tile.id)} className={adminButtonClass.quiet}>
                      Edit
                    </button>
                    {confirmId === tile.id ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                        {tiles.some((entry) => entry.parentId === tile.id)
                          ? "Remove? Its subcategories move up one level."
                          : "Remove from the home page?"}
                        <button type="button" onClick={() => void remove(tile.id)} className="font-semibold underline">
                          Yes
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                          No
                        </button>
                      </span>
                    ) : (
                      <IconButton label="Remove category" icon="delete" danger onClick={() => setConfirmId(tile.id)} />
                    )}
                  </div>
                </div>
              </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {draft && baseline ? (
        <FormCloseGuard baseline={baseline} value={draft} onClose={() => setEdit(null)}>
          <AdminFormModal key={selected ?? "closed"} titleId="category-drawer-title" size="sm">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0">
                <h2 id="category-drawer-title" className="text-lg font-semibold text-neutral-950">
                  {creating ? "Add category" : "Edit category"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {creating ? "Create a category tile for the home page." : "Update this category tile."}
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
              <ActiveStatusField checked={draft.isActive} onChange={(isActive) => setDraft({ ...draft, isActive })} />
              <div className="relative flex min-h-28 overflow-hidden rounded-2xl bg-neutral-800">
                {draft.imageSrc ? (
                  <Image src={categoryImage(draft.imageSrc)} alt="" fill sizes="400px" className="object-cover" />
                ) : null}
                <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/10" />
                <span className="relative z-10 mt-auto px-4 py-3 text-sm font-semibold text-white">
                  {draft.label.trim() || "Label"}
                </span>
              </div>
              <ImageField
                value={categoryImage(draft.imageSrc)}
                onChange={(imageSrc) => setDraft({ ...draft, imageSrc })}
                onBusy={setUploading}
                confirmRemove
              />
              <div>
                <FieldLabel htmlFor={labelId}>
                  Label <span className="text-red-700">*</span>
                </FieldLabel>
                <input
                  id={labelId}
                  autoFocus
                  value={draft.label}
                  placeholder="Trending gadgets"
                  onChange={(event) => {
                    setDraft({ ...draft, label: event.target.value });
                    setLabelError("");
                  }}
                  aria-invalid={labelError ? true : undefined}
                  aria-describedby={labelError ? `${labelId}-error` : undefined}
                  className={cn(adminFieldClass, labelError && "border-red-400")}
                />
                {labelError ? (
                  <div id={`${labelId}-error`}>
                    <FieldError message={labelError} />
                  </div>
                ) : null}
              </div>
              <div>
                <FieldLabel htmlFor={`${labelId}-parent`}>Parent category</FieldLabel>
                <select
                  id={`${labelId}-parent`}
                  value={draft.parentId ?? ""}
                  onChange={(event) => setDraft({ ...draft, parentId: event.target.value || null })}
                  className={adminFieldClass}
                >
                  <option value="">None (top level)</option>
                  {parentOptions.map(({ item, depth }) => (
                    <option key={item.id} value={item.id}>
                      {`${"\u00a0\u00a0".repeat(depth)}${depth > 0 ? "└ " : ""}${item.label || "Untitled category"}${isContentActive(item) ? "" : " (hidden)"}`}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-neutral-500">
                  Nest this category under another one. A category cannot move under itself or its own
                  subcategories.
                </p>
              </div>
              <div>
                <FieldLabel htmlFor={`${labelId}-href`}>Link</FieldLabel>
                <input
                  id={`${labelId}-href`}
                  value={draft.href}
                  onChange={(event) => setDraft({ ...draft, href: event.target.value })}
                  placeholder="/products"
                  className={adminFieldClass}
                />
                <p className="mt-1.5 text-xs text-neutral-500">
                  Where this category goes when a customer taps it. Blank uses the products page.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
              {formError ? <p className="mr-auto text-sm text-red-700">{formError}</p> : null}
              {notice ? (
                <p role="status" className="mr-auto text-sm font-medium text-emerald-800">
                  {notice}
                </p>
              ) : null}
              <button type="button" data-form-dismiss="" onClick={() => setEdit(null)} className={adminButtonClass.secondary}>
                Cancel
              </button>
              <button type="button" onClick={() => void save()} disabled={saving || uploading} className={adminButtonClass.primary}>
                {saving ? "Saving…" : uploading ? "Uploading…" : creating ? "Save category" : "Save changes"}
              </button>
            </div>
          </AdminFormModal>
        </FormCloseGuard>
      ) : null}
    </div>
  );
}

function draftFrom(tile: CategoryTile): CategoryDraft {
  return {
    parentId: tile.parentId ?? null,
    label: tile.label,
    imageSrc: tile.imageSrc,
    href: tile.href,
    isActive: tile.isActive,
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
