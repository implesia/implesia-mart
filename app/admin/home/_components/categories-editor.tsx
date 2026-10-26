"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  blankCategoryDraft,
  categoryImage,
  createCategory,
  deleteCategory,
  getCategorySection,
  reorderCategories,
  updateCategory,
  updateCategoryHeading,
  type CategoryDraft,
  type CategorySection,
  type CategoryTile,
} from "@/lib/mart-api/categories";
import {
  buildCategoryTree,
  dropOrder,
  filterCategoryRows,
  flattenCategoryTree,
  selfAndDescendantIds,
  siblingOrder,
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [pendingParent, setPendingParent] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");
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
      const next = blankCategoryDraft(pendingParent);
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
    const search = next.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => {
      setNotice("");
      setSavedId(null);
    }, 1600);
  }

  async function refresh() {
    try {
      setSection(await getCategorySection());
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not load categories.");
    }
  }

  function addUnder(parentId: string | null) {
    setPendingParent(parentId);
    setOpenKey(null);
    setEdit("new");
  }

  async function saveHeading(heading: string) {
    if (!section) return;
    setSection({ ...section, heading: await updateCategoryHeading(heading) });
  }

  async function save() {
    if (!draft || saving || uploading || !section) return;
    const label = draft.label.trim();
    if (!label) {
      setLabelError("Name is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const nextDraft = { ...draft, label, slug: draft.slug.trim().toLowerCase() };
    try {
      if (creating) {
        const created = await createCategory(nextDraft);
        setSection({ ...section, tiles: [...section.tiles, created] });
        setSavedId(created.id);
        focusId.current = created.id;
      } else if (selected) {
        const previousParentId =
          section.tiles.find((entry) => entry.id === selected)?.parentId ?? null;
        const updated = await updateCategory(selected, nextDraft, previousParentId);
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
      void refresh();
    } catch (error) {
      setSaving(false);
      setFormError(error instanceof MartApiError ? error.message : "Could not save the category.");
    }
  }

  async function remove(id: string) {
    if (!section) return;
    setLoadError("");
    try {
      await deleteCategory(id, reassignTo || null);
      if (selected === id) setEdit(null);
      setConfirmId(null);
      setReassignTo("");
      flash("Removed");
      await refresh();
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not remove the category.");
    }
  }

  async function applyOrder(next: { parentId: string | null; ids: string[] } | null) {
    if (!next) return;
    setLoadError("");
    try {
      setSection(
        section
          ? { ...section, tiles: await reorderCategories(next.parentId, next.ids) }
          : section,
      );
    } catch (error) {
      setLoadError(
        error instanceof MartApiError ? error.message : "Could not reorder the categories.",
      );
    }
  }

  async function move(id: string, direction: -1 | 1) {
    if (!section) return;
    await applyOrder(siblingOrder(section.tiles, id, direction));
  }

  async function dropOn(targetId: string) {
    const dragged = dragId;
    setDragId(null);
    setOverId(null);
    if (!dragged || dragged === targetId || !section) return;
    const next = dropOrder(section.tiles, dragged, targetId);
    if (!next) {
      setLoadError("Drag within the same parent. Change the parent in Edit to move a category.");
      return;
    }
    await applyOrder(next);
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
  const shownRows = filterCategoryRows(treeRows, query).filter(({ item }) =>
    statusFilter === "all" ? true : statusFilter === "hidden" ? !item.visible : item.visible,
  );
  const filtering = query.trim() !== "" || statusFilter !== "all";
  const parentOptions = treeRows.filter(
    (row) => !(selected && selected !== "new" && selfAndDescendantIds(tiles, selected).has(row.item.id)),
  );
  const maxDepth = 6;
  const labelOf = new Map(tiles.map((tile) => [tile.id, tile.label || "Untitled category"]));

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Categories"
        description="Organise the catalog: categories, subcategories and what customers see in the storefront menu."
        sectionId="categories"
        extra={
          <button type="button" onClick={() => addUnder(null)} className={adminButtonClass.primary}>
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
                  <button type="button" onClick={() => addUnder(null)} className={cn(adminButtonClass.primary, "mt-4")}>
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
              {filtering ? ` · ${shownRows.length} shown` : ""}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or slug"
                aria-label="Search categories"
                className={cn(adminFieldClass, "max-w-xs")}
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                aria-label="Filter by visibility"
                className={cn(adminFieldClass, "w-auto")}
              >
                <option value="all">All</option>
                <option value="active">Visible on the storefront</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          {shownRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">
              No categories match this search.
            </p>
          ) : null}
          <ol>
            {shownRows.map(({ item: tile, depth }) => {
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
                      className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <MaterialIcon name="drag_indicator" className="text-[18px]" />
                    </button>
                    <button
                      id={`category-${tile.id}`}
                      type="button"
                      onClick={() => setEdit(tile.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="w-5 shrink-0 text-right text-xs text-neutral-500 tabular-nums">{siblingIndex + 1}</span>
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {tile.imageSrc ? (
                          <Image src={categoryImage(tile.imageSrc)} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-neutral-500">
                            <MaterialIcon name="image" className="text-[18px]" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-neutral-950">{tile.label || "Untitled category"}</span>
                          <VisibilityBadge active={isContentActive(tile)} />
                          {isContentActive(tile) && !tile.visible ? (
                            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              Hidden by parent
                            </span>
                          ) : null}
                        </span>
                        <span className="block truncate text-xs text-neutral-500">
                          {depth > 0 && tile.parentId ? `in ${labelOf.get(tile.parentId)} · ` : ""}/{tile.slug} ·{" "}
                          {tile.subtreeProductCount === 1 ? "1 product" : `${tile.subtreeProductCount} products`}
                          {tile.productCount !== tile.subtreeProductCount ? ` (${tile.productCount} direct)` : ""}
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => addUnder(tile.id)}
                      aria-label={`Add subcategory under ${tile.label}`}
                      disabled={tile.depth >= maxDepth}
                      className={adminButtonClass.quiet}
                    >
                      Add subcategory
                    </button>
                    <IconButton label="Move earlier" icon="arrow_upward" disabled={siblingIndex <= 0} onClick={() => void move(tile.id, -1)} />
                    <IconButton label="Move later" icon="arrow_downward" disabled={siblingIndex === siblings.length - 1} onClick={() => void move(tile.id, 1)} />
                    <button type="button" onClick={() => setEdit(tile.id)} className={adminButtonClass.quiet}>
                      Edit
                    </button>
                    {confirmId === tile.id ? (
                      <span className="flex flex-wrap items-center gap-1 rounded-2xl bg-red-50 px-2 py-1 text-xs text-red-700">
                        {tile.childCount > 0 || tile.productCount > 0 ? (
                          <>
                            <label htmlFor={`reassign-${tile.id}`}>
                              This category has {tile.childCount} subcategor{tile.childCount === 1 ? "y" : "ies"} and{" "}
                              {tile.productCount} product{tile.productCount === 1 ? "" : "s"}. Move them to:
                            </label>
                            <select
                              id={`reassign-${tile.id}`}
                              value={reassignTo}
                              onChange={(event) => setReassignTo(event.target.value)}
                              className="max-w-48 rounded-md border border-red-200 bg-white px-1 py-1"
                            >
                              <option value="">Choose a category</option>
                              {treeRows
                                .filter((row) => !selfAndDescendantIds(tiles, tile.id).has(row.item.id))
                                .map(({ item, depth: rowDepth }) => (
                                  <option key={item.id} value={item.id}>
                                    {`${"\u00a0\u00a0".repeat(rowDepth)}${item.label}`}
                                  </option>
                                ))}
                            </select>
                          </>
                        ) : (
                          "Remove this category?"
                        )}
                        <button
                          type="button"
                          disabled={(tile.childCount > 0 || tile.productCount > 0) && !reassignTo}
                          onClick={() => void remove(tile.id)}
                          className="font-semibold underline disabled:opacity-40"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmId(null);
                            setReassignTo("");
                          }}
                          className="font-semibold"
                        >
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
                  {creating ? "Create a category or subcategory." : "Update this category."}
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
                  Name <span className="text-red-700">*</span>
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
                    <option key={item.id} value={item.id} disabled={item.depth >= maxDepth}>
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
                <FieldLabel htmlFor={`${labelId}-slug`}>Slug</FieldLabel>
                <input
                  id={`${labelId}-slug`}
                  value={draft.slug}
                  onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                  placeholder="generated from the name"
                  className={adminFieldClass}
                />
                <p className="mt-1.5 text-xs text-neutral-500">
                  Used in the address /products?category=slug. Lowercase letters, numbers and hyphens;
                  must be unique. Leave blank to generate it.
                </p>
              </div>
              <div>
                <FieldLabel htmlFor={`${labelId}-description`}>Description</FieldLabel>
                <textarea
                  id={`${labelId}-description`}
                  value={draft.description}
                  rows={3}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${labelId}-meta-title`}>SEO title</FieldLabel>
                <input
                  id={`${labelId}-meta-title`}
                  value={draft.metaTitle}
                  maxLength={160}
                  onChange={(event) => setDraft({ ...draft, metaTitle: event.target.value })}
                  className={adminFieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${labelId}-meta-description`}>SEO description</FieldLabel>
                <textarea
                  id={`${labelId}-meta-description`}
                  value={draft.metaDescription}
                  maxLength={320}
                  rows={2}
                  onChange={(event) => setDraft({ ...draft, metaDescription: event.target.value })}
                  className={adminFieldClass}
                />
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
    slug: tile.slug,
    description: tile.description,
    imageSrc: tile.imageSrc,
    isActive: tile.isActive,
    metaTitle: tile.metaTitle,
    metaDescription: tile.metaDescription,
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
