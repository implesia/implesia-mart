"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { cn } from "@/lib/utils";
import {
  catalogChoices,
  readHomeSections,
  saveHomeSections,
  type CatalogChoice,
  type ShowcaseRow,
} from "@/lib/mart-mock/home-sections";
import { formatTaka, getAdminProduct } from "@/lib/mart-mock/store";

import { AdminFormModal } from "../../_components/admin-form-modal";
import { FormCloseGuard } from "../../_components/form-close-guard";
import {
  adminButtonClass,
  adminFieldClass,
  FieldError,
  FieldLabel,
} from "../../_components/admin-ui";
import { HomeCmsHeader } from "./home-cms-header";
import { SectionCopyForm } from "./section-copy-form";

export function ShowcaseRows({ rows }: { rows: ShowcaseRow[] }) {
  const params = useSearchParams();
  const openRows = rows.filter((row) => params.get(`row-${row.id}`));
  const [saved, setSaved] = useState<{ rowId: string; slug: string } | null>(
    null,
  );

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(null), 1600);
    return () => window.clearTimeout(timer);
  }, [saved]);

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Showcase"
        description="Manage the category product rows displayed on your storefront."
        sectionId="showcase"
      />
      {rows.map((row) => (
        <ShowcaseRowBlock
          key={row.id}
          row={row}
          savedSlug={saved?.rowId === row.id ? saved.slug : null}
        />
      ))}
      {openRows.length > 0 ? (
        <ShowcaseDrawer
          rows={openRows}
          onSaved={(rowId, slug) => setSaved({ rowId, slug })}
        />
      ) : null}
    </div>
  );
}

function ShowcaseRowBlock({
  row,
  savedSlug,
}: {
  row: ShowcaseRow;
  savedSlug: string | null;
}) {
  const params = useSearchParams();
  const selected = params.get(`row-${row.id}`);
  const choices = catalogChoices().filter((item) => item.categoryId === row.id);
  const bySlug = new Map(choices.map((item) => [item.slug, item]));
  const unused = choices.filter((item) => !row.slugs.includes(item.slug));
  const [notice, setNotice] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const { setRowEdit } = useRowQuery();

  useEffect(() => {
    if (selected || !savedSlug || document.querySelector("[role=dialog]"))
      return;
    document.getElementById(`showcase-${row.id}-${savedSlug}`)?.focus();
  }, [selected, savedSlug, row.id]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1600);
  }

  function patch(partial: Partial<ShowcaseRow>) {
    const doc = readHomeSections();
    saveHomeSections({
      ...doc,
      showcase: doc.showcase.map((item) =>
        item.id === row.id ? { ...item, ...partial } : item,
      ),
    });
  }

  function remove(slug: string) {
    const doc = readHomeSections();
    saveHomeSections({
      ...doc,
      showcase: doc.showcase.map((item) =>
        item.id === row.id
          ? { ...item, slugs: item.slugs.filter((entry) => entry !== slug) }
          : item,
      ),
    });
    if (selected === slug) setRowEdit(row.id, null);
    setConfirmId(null);
    flash("Removed");
  }

  function move(slug: string, direction: -1 | 1) {
    const doc = readHomeSections();
    const current = doc.showcase.find((item) => item.id === row.id);
    if (!current) return;
    const index = current.slugs.indexOf(slug);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.slugs.length) return;
    const next = [...current.slugs];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    saveHomeSections({
      ...doc,
      showcase: doc.showcase.map((entry) =>
        entry.id === row.id ? { ...entry, slugs: next } : entry,
      ),
    });
  }

  function dropOn(targetSlug: string) {
    if (!dragId || dragId === targetSlug) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const doc = readHomeSections();
    const current = doc.showcase.find((item) => item.id === row.id);
    if (!current) return;
    const next = [...current.slugs];
    const from = next.indexOf(dragId);
    const to = next.indexOf(targetSlug);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    saveHomeSections({
      ...doc,
      showcase: doc.showcase.map((entry) =>
        entry.id === row.id ? { ...entry, slugs: next } : entry,
      ),
    });
    setDragId(null);
    setOverId(null);
  }

  return (
    <section className="space-y-4" aria-labelledby={`showcase-row-${row.id}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2
          id={`showcase-row-${row.id}`}
          className="text-lg font-semibold text-neutral-950"
        >
          {row.heading || "Category row"}
        </h2>
        <button
          type="button"
          onClick={() => setRowEdit(row.id, "new")}
          disabled={unused.length === 0}
          title={
            unused.length === 0
              ? "Every product in this category is already in the row."
              : undefined
          }
          className={adminButtonClass.primary}
        >
          <MaterialIcon name="add" className="text-[18px]" />
          Add product
        </button>
      </div>

      {notice || savedSlug ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice || "Saved"}. This row is up to date.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-[#f5f6f8] ring-1 ring-neutral-200/90">
        <div className="px-4 py-4 sm:px-5">
          <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 sm:px-5 sm:py-5">
            <SectionCopyForm
              values={{ heading: row.heading, href: row.href }}
              fields={[
                { name: "heading", label: "Heading" },
                { name: "href", label: "View all link" },
              ]}
              saveLabel="Save heading"
              onSave={(next) =>
                patch({ heading: next.heading ?? "", href: next.href ?? "" })
              }
            />
            {row.slugs.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <p className="text-sm font-semibold text-neutral-950">
                  No products in this row yet
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                  Add a product from this category so it appears in the row on
                  the home page.
                </p>
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {row.slugs.map((slug) => {
                  const product = bySlug.get(slug);
                  return (
                    <li key={slug}>
                      <button
                        type="button"
                        onClick={() => setRowEdit(row.id, slug)}
                        className={cn(
                          "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 ring-neutral-200",
                          selected === slug && "ring-2 ring-primary",
                        )}
                      >
                        <span className="relative aspect-4/5 bg-neutral-100">
                          {product ? (
                            <Image
                              src={product.imageSrc}
                              alt=""
                              fill
                              sizes="(max-width: 1280px) 40vw, 20vw"
                              className="object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 px-2.5 py-2.5">
                          <span className="block truncate text-sm font-semibold text-neutral-950">
                            {product?.title || "Product unavailable"}
                          </span>
                          {product ? (
                            <span className="mt-0.5 block text-xs text-neutral-500">
                              {formatTaka(product.price)}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {row.slugs.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-neutral-950">
              {row.slugs.length === 1
                ? "1 product"
                : `${row.slugs.length} products`}
            </h3>
          </div>
          <ol>
            {row.slugs.map((slug, index) => {
              const product = bySlug.get(slug);
              return (
                <li
                  key={slug}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOverId(slug);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropOn(slug);
                  }}
                  className={cn(
                    "border-t border-neutral-100 first:border-t-0",
                    selected === slug && "bg-primary/5",
                    savedSlug === slug && "bg-emerald-50",
                    overId === slug &&
                      dragId &&
                      dragId !== slug &&
                      "bg-primary/10",
                    dragId === slug && "opacity-60",
                  )}
                >
                  <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <button
                        type="button"
                        draggable
                        aria-label={`Reorder ${product?.title || "product"}`}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", slug);
                          event.dataTransfer.effectAllowed = "move";
                          setDragId(slug);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverId(null);
                        }}
                        className="grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <MaterialIcon
                          name="drag_indicator"
                          className="text-[18px]"
                        />
                      </button>
                      <button
                        id={`showcase-${row.id}-${slug}`}
                        type="button"
                        onClick={() => setRowEdit(row.id, slug)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
                          {index + 1}
                        </span>
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          {product ? (
                            <Image
                              src={product.imageSrc}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="grid size-full place-items-center text-neutral-400">
                              <MaterialIcon
                                name="image"
                                className="text-[18px]"
                              />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-neutral-950">
                            {product?.title || "Product unavailable"}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">
                            {product
                              ? formatTaka(product.price)
                              : "Not in this category"}
                          </span>
                        </span>
                      </button>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                      <IconButton
                        label="Move earlier"
                        icon="arrow_upward"
                        disabled={index === 0}
                        onClick={() => move(slug, -1)}
                      />
                      <IconButton
                        label="Move later"
                        icon="arrow_downward"
                        disabled={index === row.slugs.length - 1}
                        onClick={() => move(slug, 1)}
                      />
                      <button
                        type="button"
                        onClick={() => setRowEdit(row.id, slug)}
                        className={adminButtonClass.quiet}
                      >
                        Edit
                      </button>
                      {confirmId === slug ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                          Remove from the home page?
                          <button
                            type="button"
                            onClick={() => remove(slug)}
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
                          label="Remove product"
                          icon="delete"
                          danger
                          onClick={() => setConfirmId(slug)}
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function ShowcaseDrawer({
  rows,
  onSaved,
}: {
  rows: ShowcaseRow[];
  onSaved: (rowId: string, slug: string) => void;
}) {
  const { setRowEdit } = useRowQuery();
  const [snapshots, setSnapshots] = useState<
    Record<string, { baseline: string | null; value: string | null }>
  >({});
  const report = useCallback(
    (rowId: string, baseline: string | null, value: string | null) => {
      setSnapshots((current) => {
        const prev = current[rowId];
        if (prev?.baseline === baseline && prev?.value === value)
          return current;
        return { ...current, [rowId]: { baseline, value } };
      });
    },
    [],
  );
  const baseline = Object.fromEntries(
    Object.entries(snapshots).map(([id, item]) => [id, item.baseline]),
  );
  const value = Object.fromEntries(
    Object.entries(snapshots).map(([id, item]) => [id, item.value]),
  );

  function closeAll() {
    for (const row of rows) setRowEdit(row.id, null);
  }

  return (
    <FormCloseGuard baseline={baseline} value={value} onClose={closeAll}>
      <AdminFormModal titleId="showcase-drawer-title" size="md">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="showcase-drawer-title"
              className="text-lg font-semibold text-neutral-950"
            >
              {rows.length === 1 ? "Edit product" : "Edit products"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {rows.length === 1
                ? `Choose the product for ${rows[0]?.heading || "this row"}.`
                : "Choose a product for each open row."}
            </p>
          </div>
          <button
            type="button"
            data-form-dismiss=""
            aria-label="Close"
            title="Close"
            onClick={closeAll}
            className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
          {rows.map((row, index) => (
            <ShowcaseProductForm
              key={row.id}
              row={row}
              autoFocus={index === 0}
              onSaved={onSaved}
              onState={report}
            />
          ))}
        </div>
      </AdminFormModal>
    </FormCloseGuard>
  );
}

function openedSlug(row: ShowcaseRow, selected: string | null) {
  if (!selected) return null;
  if (selected === "new") {
    const taken = new Set(row.slugs);
    return (
      catalogChoices().find(
        (item) => item.categoryId === row.id && !taken.has(item.slug),
      )?.slug ?? null
    );
  }
  return row.slugs.includes(selected) ? selected : null;
}

function ShowcaseProductForm({
  row,
  autoFocus,
  onSaved,
  onState,
}: {
  row: ShowcaseRow;
  autoFocus: boolean;
  onSaved: (rowId: string, slug: string) => void;
  onState: (
    rowId: string,
    baseline: string | null,
    value: string | null,
  ) => void;
}) {
  const rowId = row.id;
  const params = useSearchParams();
  const selected = params.get(`row-${rowId}`);
  const creating = selected === "new";
  const choices = catalogChoices().filter((item) => item.categoryId === rowId);
  const bySlug = new Map(choices.map((item) => [item.slug, item]));
  const baseline = openedSlug(row, selected);
  const selectionKey = `${selected ?? ""}:${baseline ?? ""}`;
  const [draft, setDraft] = useState<string | null>(baseline);
  const [appliedKey, setAppliedKey] = useState(selectionKey);
  const [productError, setProductError] = useState("");
  const [saving, setSaving] = useState(false);
  const productId = useId();
  const { setRowEdit } = useRowQuery();
  const used = new Set(row.slugs);

  if (appliedKey !== selectionKey) {
    setAppliedKey(selectionKey);
    setDraft(baseline);
    setProductError("");
  }

  useEffect(() => {
    onState(rowId, baseline, draft);
  }, [onState, rowId, baseline, draft]);

  function save() {
    if (!draft || saving) return;
    setSaving(true);
    const doc = readHomeSections();
    const current = doc.showcase.find((item) => item.id === rowId);
    if (!current) {
      setSaving(false);
      return;
    }
    if (creating) {
      if (current.slugs.includes(draft)) {
        setSaving(false);
        setProductError("That product is already in this row.");
        return;
      }
      saveHomeSections({
        ...doc,
        showcase: doc.showcase.map((item) =>
          item.id === rowId ? { ...item, slugs: [...item.slugs, draft] } : item,
        ),
      });
    } else if (selected) {
      if (draft !== selected && current.slugs.includes(draft)) {
        setSaving(false);
        setProductError("That product is already in this row.");
        return;
      }
      saveHomeSections({
        ...doc,
        showcase: doc.showcase.map((item) =>
          item.id === rowId
            ? {
                ...item,
                slugs: item.slugs.map((entry) =>
                  entry === selected ? draft : entry,
                ),
              }
            : item,
        ),
      });
    }
    setSaving(false);
    onSaved(rowId, draft);
    setRowEdit(rowId, null);
  }

  const missing = Boolean(selected && selected !== "new" && baseline === null);
  const product = draft ? bySlug.get(draft) : undefined;
  const heading = row.heading || "Category row";

  if (missing) {
    return (
      <p className="text-sm text-neutral-600">
        This product is no longer in {heading}.{" "}
        <button
          type="button"
          data-form-dismiss=""
          onClick={() => setRowEdit(rowId, null)}
          className="font-medium text-primary"
        >
          Close
        </button>
      </p>
    );
  }

  if (!draft) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
          {creating ? "Add product" : "Edit product"}
        </p>
        <h3 className="mt-1 text-base font-semibold text-neutral-950">
          {creating ? "New product" : product?.title || heading}
        </h3>
        <p className="mt-0.5 text-sm text-neutral-500">{heading}</p>
      </div>
      {product ? <ProductPreview product={product} /> : null}
      <div>
        <FieldLabel htmlFor={productId}>
          Product <span className="text-red-700">*</span>
        </FieldLabel>
        <select
          id={productId}
          autoFocus={autoFocus}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setProductError("");
          }}
          aria-invalid={productError ? true : undefined}
          aria-describedby={productError ? `${productId}-error` : undefined}
          className={cn(adminFieldClass, productError && "border-red-400")}
        >
          {choices.map((item) => (
            <option
              key={item.slug}
              value={item.slug}
              disabled={
                used.has(item.slug) && item.slug !== (creating ? "" : selected)
              }
            >
              {item.title}
            </option>
          ))}
        </select>
        {productError ? (
          <div id={`${productId}-error`}>
            <FieldError message={productError} />
          </div>
        ) : (
          <p className="mt-1.5 text-xs text-neutral-500">
            Only products from this category. Ones already in the row stay
            unavailable.{" "}
            {draft && getAdminProduct(draft)?.published === false
              ? "This product is hidden, so it stays off the website until you publish it on the product page."
              : "Visibility follows the product’s Live or Hidden status."}
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          data-form-dismiss=""
          onClick={() => setRowEdit(rowId, null)}
          className={adminButtonClass.secondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={adminButtonClass.primary}
        >
          {saving ? "Saving…" : creating ? "Save product" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function useRowQuery() {
  const pathname = usePathname();
  const router = useRouter();

  function setRowEdit(rowId: string, slug: string | null) {
    const next = new URLSearchParams(window.location.search);
    const key = `row-${rowId}`;
    if (slug) next.set(key, slug);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return { setRowEdit };
}

function ProductPreview({ product }: { product: CatalogChoice }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f8] p-3">
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
        <Image
          src={product.imageSrc}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-neutral-950">
          {product.title}
        </span>
        <span className="mt-0.5 block text-xs text-neutral-500">
          {formatTaka(product.price)}
        </span>
      </span>
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
