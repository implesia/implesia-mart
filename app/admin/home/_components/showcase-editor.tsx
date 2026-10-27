"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { featuredImage } from "@/lib/mart-api/featured";
import type { FeaturedProduct } from "@/lib/mart-api/featured";
import { MartApiError } from "@/lib/mart-api/products";
import {
  createShowcaseItem,
  deleteShowcaseItem,
  getShowcaseSection,
  reorderShowcaseItems,
  updateShowcaseItem,
  updateShowcaseRow,
  type ShowcaseRow,
  type ShowcaseSection,
} from "@/lib/mart-api/showcase";
import { formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

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

export function ShowcaseRows() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [section, setSection] = useState<ShowcaseSection | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openKey, setOpenKey] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string | null>>({});
  const [baselines, setBaselines] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<{ key: string; message: string } | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ key: string; message: string } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const focusId = useRef<string | null>(null);
  const rows = section?.rows ?? [];
  const selection = rows
    .map((row) => `${row.key}:${params.get(`row-${row.key}`) ?? ""}`)
    .join("|");
  const openRows = rows.filter((row) => params.get(`row-${row.key}`));

  useEffect(() => {
    let cancelled = false;
    getShowcaseSection()
      .then((next) => {
        if (!cancelled) setSection(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof MartApiError ? error.message : "Could not load the showcase.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (section && selection !== openKey) {
    const next: Record<string, string | null> = {};
    for (const row of section.rows) {
      const selected = params.get(`row-${row.key}`);
      if (!selected) next[row.key] = null;
      else if (selected === "new") {
        const used = new Set(row.items.map((item) => item.productId));
        next[row.key] = row.choices.find((choice) => !used.has(choice.id))?.id ?? null;
      } else {
        next[row.key] = row.items.find((item) => item.id === selected)?.productId ?? null;
      }
    }
    setOpenKey(selection);
    setBaselines(next);
    setDrafts(next);
    setFormError(null);
  }

  useEffect(() => {
    if (!focusId.current || openRows.length > 0) return;
    const id = focusId.current;
    focusId.current = null;
    document.getElementById(id)?.focus();
  }, [openRows.length, savedId]);

  function setRowEdit(rowKey: string, id: string | null) {
    const next = new URLSearchParams(window.location.search);
    const key = `row-${rowKey}`;
    if (id) next.set(key, id);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function flash(key: string, message: string) {
    setNotice({ key, message });
    window.setTimeout(() => {
      setNotice(null);
      setSavedId(null);
    }, 1600);
  }

  function replaceRow(next: ShowcaseSection, key: string) {
    setSection(next);
    return next.rows.find((row) => row.key === key);
  }

  async function saveCopy(row: ShowcaseRow, values: Record<string, string>) {
    setLoadError("");
    const next = await updateShowcaseRow(row.key, {
      heading: values.heading ?? "",
      href: values.href ?? "",
    });
    setSection(next);
  }

  async function saveItem(row: ShowcaseRow) {
    const productId = drafts[row.key];
    const selected = params.get(`row-${row.key}`);
    if (!productId || !selected || savingKey) return;
    setSavingKey(row.key);
    setFormError(null);
    try {
      if (selected === "new") {
        const created = await createShowcaseItem(row.key, productId);
        setSection({
          ...section!,
          rows: section!.rows.map((entry) =>
            entry.key === row.key ? { ...entry, items: [...entry.items, created] } : entry,
          ),
        });
        setSavedId(created.id);
        focusId.current = `showcase-${row.key}-${created.id}`;
      } else {
        const updated = await updateShowcaseItem(row.key, selected, productId);
        setSection({
          ...section!,
          rows: section!.rows.map((entry) =>
            entry.key === row.key
              ? {
                  ...entry,
                  items: entry.items.map((item) => (item.id === selected ? updated : item)),
                }
              : entry,
          ),
        });
        setSavedId(selected);
        focusId.current = `showcase-${row.key}-${selected}`;
      }
      setSavingKey(null);
      flash(row.key, "Saved");
      setRowEdit(row.key, null);
    } catch (error) {
      setSavingKey(null);
      setFormError({
        key: row.key,
        message: error instanceof MartApiError ? error.message : "Could not save the product.",
      });
    }
  }

  async function remove(row: ShowcaseRow, id: string) {
    setLoadError("");
    try {
      await deleteShowcaseItem(row.key, id);
      setSection({
        ...section!,
        rows: section!.rows.map((entry) =>
          entry.key === row.key
            ? { ...entry, items: entry.items.filter((item) => item.id !== id) }
            : entry,
        ),
      });
      if (params.get(`row-${row.key}`) === id) setRowEdit(row.key, null);
      flash(row.key, "Removed");
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not remove the product.");
    }
  }

  async function move(row: ShowcaseRow, id: string, direction: -1 | 1) {
    setLoadError("");
    const index = row.items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= row.items.length) return;
    const next = [...row.items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    try {
      replaceRow(await reorderShowcaseItems(row.key, next.map((entry) => entry.id)), row.key);
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not reorder the products.");
    }
  }

  async function dropOn(row: ShowcaseRow, targetId: string, dragId: string) {
    if (!dragId || dragId === targetId) return;
    const next = [...row.items];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setLoadError("");
    try {
      replaceRow(await reorderShowcaseItems(row.key, next.map((entry) => entry.id)), row.key);
    } catch (error) {
      setLoadError(error instanceof MartApiError ? error.message : "Could not reorder the products.");
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

  return (
    <div className="min-w-0 space-y-4">
      <HomeCmsHeader
        title="Showcase"
        description="Manage the category product rows displayed on your storefront."
        sectionId="showcase"
      />
      {loadError ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      ) : null}
      {rows.map((row) => (
        <ShowcaseRowBlock
          key={row.key}
          row={row}
          notice={notice?.key === row.key ? notice.message : ""}
          savedId={savedId}
          onSaveCopy={(values) => saveCopy(row, values)}
          onRemove={(id) => remove(row, id)}
          onMove={(id, direction) => move(row, id, direction)}
          onDrop={(targetId, dragId) => dropOn(row, targetId, dragId)}
          onEdit={(id) => setRowEdit(row.key, id)}
        />
      ))}
      {openRows.length > 0 ? (
        <FormCloseGuard baseline={baselines} value={drafts} onClose={() => {
          for (const row of openRows) setRowEdit(row.key, null);
        }}>
          <AdminFormModal titleId="showcase-drawer-title" size="md">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0">
                <h2 id="showcase-drawer-title" className="text-lg font-semibold text-neutral-950">
                  {openRows.length === 1 ? "Edit product" : "Edit products"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {openRows.length === 1
                    ? `Choose the product for ${openRows[0]?.heading || "this row"}.`
                    : "Choose a product for each open row."}
                </p>
              </div>
              <button
                type="button"
                data-form-dismiss=""
                aria-label="Close"
                title="Close"
                onClick={() => {
                  for (const row of openRows) setRowEdit(row.key, null);
                }}
                className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
              {openRows.map((row, index) => (
                <ShowcaseProductForm
                  key={row.key}
                  row={row}
                  selected={params.get(`row-${row.key}`)}
                  draft={drafts[row.key] ?? null}
                  autoFocus={index === 0}
                  saving={savingKey === row.key}
                  error={formError?.key === row.key ? formError.message : ""}
                  onDraft={(productId) => {
                    setDrafts((current) => ({ ...current, [row.key]: productId }));
                    setFormError(null);
                  }}
                  onSave={() => void saveItem(row)}
                  onClose={() => setRowEdit(row.key, null)}
                />
              ))}
            </div>
          </AdminFormModal>
        </FormCloseGuard>
      ) : null}
    </div>
  );
}

function ShowcaseRowBlock({
  row,
  notice,
  savedId,
  onSaveCopy,
  onRemove,
  onMove,
  onDrop,
  onEdit,
}: {
  row: ShowcaseRow;
  notice: string;
  savedId: string | null;
  onSaveCopy: (values: Record<string, string>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onMove: (id: string, direction: -1 | 1) => Promise<void>;
  onDrop: (targetId: string, dragId: string) => Promise<void>;
  onEdit: (id: string | null) => void;
}) {
  const params = useSearchParams();
  const selected = params.get(`row-${row.key}`);
  const byId = new Map(row.choices.map((item) => [item.id, item]));
  const used = new Set(row.items.map((item) => item.productId));
  const unused = row.choices.filter((item) => !used.has(item.id));
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  return (
    <section className="space-y-4" aria-labelledby={`showcase-row-${row.key}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id={`showcase-row-${row.key}`} className="text-lg font-semibold text-neutral-950">
          {row.heading || "Category row"}
        </h2>
        <button
          type="button"
          onClick={() => onEdit("new")}
          disabled={unused.length === 0}
          title={unused.length === 0 ? "Every product in this category is already in the row." : undefined}
          className={adminButtonClass.primary}
        >
          <MaterialIcon name="add" className="text-[18px]" />
          Add product
        </button>
      </div>
      {notice && !selected ? (
        <p role="status" className="text-sm font-medium text-emerald-800">
          {notice}. This row is up to date.
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
              onSave={onSaveCopy}
            />
            <p className="mt-3 text-sm text-neutral-500">
              Shown on the home page, in this order. Hidden products stay off the home page.
            </p>
            {row.items.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <p className="text-sm font-semibold text-neutral-950">No products in this row yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
                  Add a product from this category so it appears in the row on the home page.
                </p>
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {row.items.map((item) => {
                  const product = item.product ?? byId.get(item.productId);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onEdit(item.id)}
                        className={cn(
                          "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 ring-neutral-200",
                          selected === item.id && "ring-2 ring-primary",
                        )}
                      >
                        <ProductThumb product={product} sizes="(max-width: 1280px) 40vw, 20vw" />
                        <span className="min-w-0 px-2.5 py-2.5">
                          <span className="block truncate text-sm font-semibold text-neutral-950">
                            {product?.title || "Product unavailable"}
                          </span>
                          {product ? (
                            <span className="mt-0.5 block text-xs text-neutral-500">
                              {formatTaka(product.price)}
                              {product.published ? "" : " · Hidden"}
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
      {row.items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
          <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-neutral-950">
              {row.items.length === 1 ? "1 product" : `${row.items.length} products`}
            </h3>
          </div>
          <ol>
            {row.items.map((item, index) => {
              const product = item.product ?? byId.get(item.productId);
              return (
                <li
                  key={item.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOverId(item.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = dragId;
                    setDragId(null);
                    setOverId(null);
                    if (from) void onDrop(item.id, from);
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
                        aria-label={`Reorder ${product?.title || "product"}`}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", item.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDragId(item.id);
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
                        id={`showcase-${row.key}-${item.id}`}
                        type="button"
                        onClick={() => onEdit(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <span className="w-5 shrink-0 text-right text-xs text-neutral-500 tabular-nums">
                          {index + 1}
                        </span>
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          {product?.imageSrc ? (
                            <Image src={featuredImage(product.imageSrc)} alt="" fill sizes="48px" className="object-cover" />
                          ) : (
                            <span className="grid size-full place-items-center text-neutral-500">
                              <MaterialIcon name="image" className="text-[18px]" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-neutral-950">
                            {product?.title || "Product unavailable"}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">
                            {product
                              ? `${formatTaka(product.price)}${product.published ? "" : " · Hidden"}`
                              : "Not in this category"}
                          </span>
                        </span>
                      </button>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-11 sm:pl-0">
                      <IconButton label="Move earlier" icon="arrow_upward" disabled={index === 0} onClick={() => void onMove(item.id, -1)} />
                      <IconButton
                        label="Move later"
                        icon="arrow_downward"
                        disabled={index === row.items.length - 1}
                        onClick={() => void onMove(item.id, 1)}
                      />
                      <button type="button" onClick={() => onEdit(item.id)} className={adminButtonClass.quiet}>
                        Edit
                      </button>
                      {confirmId === item.id ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                          Remove from the home page?
                          <button type="button" onClick={() => void onRemove(item.id).then(() => setConfirmId(null))} className="font-semibold underline">
                            Yes
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="font-semibold">
                            No
                          </button>
                        </span>
                      ) : (
                        <IconButton label="Remove product" icon="delete" danger onClick={() => setConfirmId(item.id)} />
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

function ShowcaseProductForm({
  row,
  selected,
  draft,
  autoFocus,
  saving,
  error,
  onDraft,
  onSave,
  onClose,
}: {
  row: ShowcaseRow;
  selected: string | null;
  draft: string | null;
  autoFocus: boolean;
  saving: boolean;
  error: string;
  onDraft: (productId: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const productFieldId = useId();
  const creating = selected === "new";
  const byId = new Map(row.choices.map((item) => [item.id, item]));
  const used = new Set(row.items.map((item) => item.productId));
  const kept = creating ? "" : (row.items.find((item) => item.id === selected)?.productId ?? "");
  const product = draft ? byId.get(draft) : undefined;
  const missing = Boolean(selected && selected !== "new" && draft === null);
  const heading = row.heading || "Category row";

  if (missing) {
    return (
      <p className="text-sm text-neutral-600">
        This product is no longer in {heading}.{" "}
        <button type="button" data-form-dismiss="" onClick={onClose} className="font-medium text-primary">
          Close
        </button>
      </p>
    );
  }
  if (!draft) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          {creating ? "Add product" : "Edit product"}
        </p>
        <h3 className="mt-1 text-base font-semibold text-neutral-950">
          {creating ? "New product" : product?.title || heading}
        </h3>
        <p className="mt-0.5 text-sm text-neutral-500">{heading}</p>
      </div>
      {product ? <ProductPreview product={product} /> : null}
      <div>
        <FieldLabel htmlFor={productFieldId}>
          Product <span className="text-red-700">*</span>
        </FieldLabel>
        <select
          id={productFieldId}
          autoFocus={autoFocus}
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          className={adminFieldClass}
        >
          {row.choices.map((item) => (
            <option key={item.id} value={item.id} disabled={used.has(item.id) && item.id !== kept}>
              {item.title}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-neutral-500">
          Only products from this category. Ones already in the row stay unavailable.{" "}
          {product && !product.published
            ? "This product is hidden, so it stays off the website until you publish it on the product page."
            : "Visibility follows the product’s Live or Hidden status."}
        </p>
        {error ? <FieldError message={error} /> : null}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" data-form-dismiss="" onClick={onClose} className={adminButtonClass.secondary}>
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving} className={adminButtonClass.primary}>
          {saving ? "Saving…" : creating ? "Save product" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function ProductThumb({ product, sizes }: { product: FeaturedProduct | undefined; sizes: string }) {
  return (
    <span className="relative aspect-4/5 bg-neutral-100">
      {product?.imageSrc ? (
        <Image src={featuredImage(product.imageSrc)} alt="" fill sizes={sizes} className="object-cover" />
      ) : null}
    </span>
  );
}

function ProductPreview({ product }: { product: FeaturedProduct }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f8] p-3">
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
        {product.imageSrc ? (
          <Image src={featuredImage(product.imageSrc)} alt="" fill sizes="64px" className="object-cover" />
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-neutral-950">{product.title}</span>
        <span className="mt-0.5 block text-xs text-neutral-500">{formatTaka(product.price)}</span>
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
