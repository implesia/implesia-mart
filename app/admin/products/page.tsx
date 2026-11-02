"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { categoryLabel } from "@/app/(client)/_data/products/catalog-meta";
import type { ProductCategoryId } from "@/app/(client)/_data/products/products";
import { listAdminCategories, type CategoryTile } from "@/lib/mart-api/categories";
import { categoryChips, categoryTrail } from "@/lib/mart-api/category-tree";
import {
  deleteMartProduct,
  bulkDeleteMartProducts,
  listMartProducts,
  MartApiError,
  patchMartProduct,
  type ProductListResult,
} from "@/lib/mart-api/products";
import {
  formatTaka,
  type AdminProduct,
  type StockStatus,
} from "@/lib/mart-mock/store";
import {
  bulkDeleteMessage,
  MAX_BULK_DELETE,
  selectAllState,
  type ProductBulkDeleteResult,
} from "@/lib/mart-api/product-bulk-delete";
import { cn } from "@/lib/utils";

import {
  ADMIN_STOCK_STATUS_LABEL,
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
  adminButtonClass,
  STOCK_STATUS_TONE,
} from "../_components/admin-ui";
import { useAdminNotify, useConfirmDelete } from "../_components/confirm-delete";

const PAGE_SIZE = 10;
const STOCK_FILTERS: StockStatus[] = ["available", "sold-out", "coming-soon"];
const SORTS = [
  { id: "catalog", label: "Catalog order" },
  { id: "name-asc", label: "Name, A to Z" },
  { id: "name-desc", label: "Name, Z to A" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
  { id: "stock-asc", label: "Stock, low to high" },
  { id: "stock-desc", label: "Stock, high to low" },
] as const;

type SortId = (typeof SORTS)[number]["id"];
type Visibility = "live" | "hidden";

function isCategory(value: string | null): value is ProductCategoryId {
  return Boolean(value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value));
}

function isStock(value: string | null): value is StockStatus {
  return (
    value === "available" || value === "sold-out" || value === "coming-soon"
  );
}

function isSort(value: string | null): value is SortId {
  return SORTS.some((sort) => sort.id === value);
}

function isVisibility(value: string | null): value is Visibility {
  return value === "live" || value === "hidden";
}

function ProductsView() {
  const params = useSearchParams();
  const router = useRouter();
  const category = isCategory(params.get("category"))
    ? (params.get("category") as ProductCategoryId)
    : null;
  const status = isStock(params.get("status"))
    ? (params.get("status") as StockStatus)
    : null;
  const visibility = isVisibility(params.get("visibility"))
    ? (params.get("visibility") as Visibility)
    : null;
  const sort: SortId = isSort(params.get("sort"))
    ? (params.get("sort") as SortId)
    : "catalog";
  const minPrice = params.get("min") ?? "";
  const maxPrice = params.get("max") ?? "";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(
    Boolean(minPrice || maxPrice || visibility),
  );
  const [pageState, setPageState] = useState({ key: "", page: 0 });
  const [list, setList] = useState<ProductListResult | null>(null);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  // Picks belong to one page of one filter; a new page or filter starts empty.
  const [selection, setSelection] = useState<{ key: string; ids: Set<string> }>({
    key: "",
    ids: new Set(),
  });
  const [bulkBusy, setBulkBusy] = useState(false);
  const [categories, setCategories] = useState<CategoryTile[]>([]);
  const confirmDelete = useConfirmDelete();
  const notify = useAdminNotify();

  useEffect(() => {
    let cancelled = false;
    listAdminCategories()
      .then((rows) => {
        if (!cancelled) setCategories(rows);
      })
      .catch(() => {
        /* the tabs fall back to "All"; the product list reports its own errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filterKey = `${params.toString()}|${debouncedQuery}`;
  const page = pageState.key === filterKey ? pageState.page : 0;

  const requestKey = JSON.stringify([
    debouncedQuery,
    category,
    status,
    visibility,
    minPrice,
    maxPrice,
    sort,
    page,
  ]);
  const loading = settledKey !== requestKey;
  const selectionKey = `${filterKey}|${page}`;

  useEffect(() => {
    let cancelled = false;
    listMartProducts({
      q: debouncedQuery,
      category,
      status,
      visibility,
      minPrice,
      maxPrice,
      sort,
      page: page + 1,
    })
      .then((result) => {
        if (cancelled) return;
        setList(result);
        setError("");
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(
          loadError instanceof MartApiError
            ? loadError.message
            : "Could not load products.",
        );
      })
      .finally(() => {
        if (!cancelled) setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [
    debouncedQuery,
    category,
    status,
    visibility,
    minPrice,
    maxPrice,
    sort,
    page,
    requestKey,
  ]);

  async function updateRow(
    product: AdminProduct,
    patch: { status?: StockStatus; published?: boolean },
  ) {
    if (!product.id || pendingId) return;
    setPendingId(product.id);
    setError("");
    try {
      await patchMartProduct(product.id, patch);
      if (patch.published !== undefined) {
        notify(patch.published ? "Product published" : "Moved to draft", "ok");
      }
      const result = await listMartProducts({
        q: debouncedQuery,
        category,
        status,
        visibility,
        minPrice,
        maxPrice,
        sort,
        page: page + 1,
      });
      setList(result);
    } catch (updateError) {
      const message =
        updateError instanceof MartApiError
          ? updateError.message
          : "The product could not be updated.";
      setError(message);
      if (patch.published !== undefined) notify(message, "error");
    } finally {
      setPendingId(null);
    }
  }

  function removeRow(product: AdminProduct) {
    const id = product.id;
    if (!id || pendingId) return;
    void confirmDelete({
      title: "Delete this product?",
      description: (
        <>
          <span className="font-semibold text-neutral-800">“{product.title}”</span>{" "}
          will be removed from the catalog and the store. This cannot be undone.
        </>
      ),
      successMessage: "Product deleted",
      errorMessage: "The product could not be deleted.",
      onConfirm: async () => {
        setPendingId(id);
        setError("");
        try {
          await deleteMartProduct(id);
        } finally {
          setPendingId(null);
        }
        // The delete succeeded. A failed refresh only leaves a stale row behind.
        const lastOnPage = (list?.items.length ?? 0) === 1 && page > 0;
        if (lastOnPage) {
          setPageState({ key: filterKey, page: page - 1 });
          return;
        }
        try {
          setList(
            await listMartProducts({
              q: debouncedQuery,
              category,
              status,
              visibility,
              minPrice,
              maxPrice,
              sort,
              page: page + 1,
            }),
          );
        } catch {
          setList((current) =>
            current
              ? { ...current, items: current.items.filter((item) => item.id !== id) }
              : current,
          );
        }
      },
    });
  }

  function toggleSelected(id: string, on: boolean) {
    setSelection((current) => {
      const ids = new Set(current.key === selectionKey ? current.ids : []);
      if (on) ids.add(id);
      else ids.delete(id);
      return { key: selectionKey, ids };
    });
  }

  function setPageSelected(ids: string[], on: boolean) {
    setSelection({ key: selectionKey, ids: new Set(on ? ids : []) });
  }

  function removeSelected(ids: string[]) {
    if (!ids.length || bulkBusy || pendingId) return;
    if (ids.length > MAX_BULK_DELETE) {
      notify(`Delete at most ${MAX_BULK_DELETE} products at a time.`, "error");
      return;
    }
    let outcome: ProductBulkDeleteResult | null = null;
    void confirmDelete({
      title: `Delete ${ids.length} product${ids.length === 1 ? "" : "s"}?`,
      description:
        "The selected products will be removed from the catalog and the store. This cannot be undone.",
      confirmLabel: "Delete selected",
      successMessage: () => (outcome ? bulkDeleteMessage(outcome) : "Products deleted"),
      errorMessage: "The products could not be deleted.",
      onConfirm: async () => {
        setBulkBusy(true);
        setError("");
        let result: ProductBulkDeleteResult;
        try {
          result = await bulkDeleteMartProducts(ids);
        } finally {
          setBulkBusy(false);
        }
        outcome = result;
        setSelection({ key: selectionKey, ids: new Set() });
        if (result.deleted > 0) {
          // A failed refresh only leaves stale rows behind; drop the deleted ones locally.
          const gone = new Set(result.deletedIds);
          const pageEmptied = (list?.items ?? []).every((item) => gone.has(item.id ?? ""));
          if (pageEmptied && page > 0) {
            setPageState({ key: filterKey, page: page - 1 });
          } else {
            try {
              setList(
                await listMartProducts({
                  q: debouncedQuery,
                  category,
                  status,
                  visibility,
                  minPrice,
                  maxPrice,
                  sort,
                  page: page + 1,
                }),
              );
            } catch {
              setList((current) =>
                current
                  ? { ...current, items: current.items.filter((item) => !gone.has(item.id ?? "")) }
                  : current,
              );
            }
          }
        }
        if (result.deleted === 0) {
          throw new MartApiError(
            result.failed.length
              ? "The selected products could not be deleted."
              : "The selected products were already removed.",
          );
        }
      },
    });
  }

  function hrefWith(patch: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    const next = search.toString();
    return next ? `/admin/products?${next}` : "/admin/products";
  }

  function setParam(key: string, value: string | null) {
    router.replace(hrefWith({ [key]: value }), { scroll: false });
  }

  if (loading && !list) return <ProductsSkeleton />;

  const rows = list?.items ?? [];
  const rowIds = rows.flatMap((item) => (item.id ? [item.id] : []));
  const picked = selection.key === selectionKey ? selection.ids : new Set<string>();
  const selectedIds = rowIds.filter((id) => picked.has(id));
  const pageSelection = selectAllState(rowIds, picked);
  const selectDisabled = bulkBusy || loading;
  const total = list?.total ?? 0;
  const pageCount = list?.pages ?? 0;
  const metrics = list?.metrics ?? { total: 0, live: 0, hidden: 0, soldOut: 0 };
  const categoryCounts = list?.categoryCounts ?? { all: 0 };
  const roots = categories.filter((item) => !item.parentId);
  const trail = category ? categoryTrail(categories, category) : [];
  const activeRootId = trail[0]?.id ?? null;
  const subChips = category ? categoryChips(categories, category).filter((item) => item.parentId) : [];
  const catalogEmpty =
    categoryCounts.all === 0 &&
    !status &&
    !visibility &&
    !minPrice &&
    !maxPrice &&
    !debouncedQuery;
  const advanced = Boolean(
    minPrice ||
    maxPrice ||
    visibility ||
    sort !== "catalog" ||
    status ||
    category,
  );
  const scoped = advanced || Boolean(query.trim());

  function clearFilters() {
    setQuery("");
    setFiltersOpen(false);
    router.replace("/admin/products", { scroll: false });
  }

  return (
    <div className="min-w-0 space-y-4">
      <AdminPageHeader
        title="Products"
        description="Manage your catalog, inventory, pricing, and product availability."
        action={
          <Link href="/admin/products/new" className={adminButtonClass.primary}>
            <MaterialIcon name="add" className="text-[18px]" />
            Add product
          </Link>
        }
      />

      <section
        aria-label="Catalog summary"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <Metric
          href={hrefWith({ status: null, visibility: null })}
          label="Products"
          value={String(metrics.total)}
          hint="In the current category"
          active={!status && !visibility}
        />
        <Metric
          href={hrefWith({ visibility: "live", status: null })}
          label="Published"
          value={String(metrics.live)}
          hint="Published on the store"
          active={visibility === "live"}
        />
        <Metric
          href={hrefWith({ visibility: "hidden", status: null })}
          label="Drafts"
          value={String(metrics.hidden)}
          hint="Admin only, not on the store"
          active={visibility === "hidden"}
        />
        <Metric
          href={hrefWith({ status: "sold-out", visibility: null })}
          label="Sold out"
          value={String(metrics.soldOut)}
          hint="Unavailable to buy"
          active={status === "sold-out"}
        />
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="relative block min-w-0 flex-1">
              <MaterialIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-500"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, category, or product id"
                aria-label="Search products"
                className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle pr-10 pl-10 text-sm text-neutral-950 outline-none placeholder:text-neutral-500 focus:border-primary focus:ring-3 focus:ring-primary/25"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-neutral-500 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <MaterialIcon name="close" className="text-[16px]" />
                </button>
              ) : null}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
                className={adminButtonClass.secondary}
              >
                <MaterialIcon name="tune" className="text-[18px]" />
                Filters
                {minPrice || maxPrice || visibility || status ? (
                  <span className="rounded-full bg-primary/10 px-1.5 text-xs text-[#0b3d39]">
                    On
                  </span>
                ) : null}
              </button>
              <label className="min-w-44">
                <span className="sr-only">Sort products</span>
                <select
                  value={sort}
                  onChange={(event) =>
                    setParam(
                      "sort",
                      event.target.value === "catalog"
                        ? null
                        : event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-full border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25"
                >
                  {SORTS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {scoped ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={adminButtonClass.quiet}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
          {filtersOpen ? (
            <div className="grid gap-3 border-t border-neutral-100 pt-3 sm:grid-cols-2 xl:grid-cols-4">
              <FilterSelect
                label="Stock"
                value={status ?? ""}
                onChange={(value) =>
                  setParam("status", isStock(value) ? value : null)
                }
                options={[
                  { id: "", label: "All stock" },
                  ...STOCK_FILTERS.map((id) => ({
                    id,
                    label: ADMIN_STOCK_STATUS_LABEL[id],
                  })),
                ]}
              />
              <FilterSelect
                label="Status"
                value={visibility ?? ""}
                onChange={(value) =>
                  setParam("visibility", isVisibility(value) ? value : null)
                }
                options={[
                  { id: "", label: "Published and draft" },
                  { id: "live", label: "Published" },
                  { id: "hidden", label: "Draft" },
                ]}
              />
              <FilterAmount
                label="Min price"
                value={minPrice}
                onChange={(value) => setParam("min", value || null)}
              />
              <FilterAmount
                label="Max price"
                value={maxPrice}
                onChange={(value) => setParam("max", value || null)}
              />
            </div>
          ) : null}
          <ActiveFilters
            category={category}
            categoryName={trail[trail.length - 1]?.label ?? (category ? categoryLabel(category) : "")}
            status={status}
            visibility={visibility}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onClear={setParam}
          />
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-2">
          <FilterTab
            href={hrefWith({ category: null })}
            label="All"
            count={categoryCounts.all}
            active={category == null}
          />
          {roots.map((root) => (
            <FilterTab
              key={root.id}
              href={hrefWith({ category: root.slug })}
              label={root.label}
              count={root.subtreeProductCount}
              active={activeRootId === root.id}
            />
          ))}
        </div>
        {subChips.length > 0 ? (
          <ul
            aria-label="Subcategories"
            className="flex gap-1.5 overflow-x-auto border-b border-neutral-100 px-3 py-2"
          >
            {subChips.map((chip) => (
              <li key={chip.id} className="shrink-0">
                <Link
                  href={hrefWith({ category: chip.slug })}
                  aria-current={category === chip.slug ? "page" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    category === chip.slug
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                  )}
                >
                  {chip.label} ({chip.subtreeProductCount})
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {selectedIds.length > 0 ? (
          <div
            role="region"
            aria-label="Selected products"
            className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-admin-subtle px-4 py-2.5 sm:px-5"
          >
            <p className="text-sm font-medium text-neutral-800" aria-live="polite">
              {selectedIds.length} টা selected
            </p>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageSelected(rowIds, false)}
                disabled={bulkBusy}
                className={adminButtonClass.quiet}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => removeSelected(selectedIds)}
                disabled={bulkBusy || Boolean(pendingId)}
                className={cn(
                  adminButtonClass.secondary,
                  "text-red-700 hover:bg-red-50 focus-visible:ring-red-300",
                )}
              >
                <MaterialIcon name="delete" className="text-[18px]" />
                {bulkBusy ? "Deleting…" : "Delete selected"}
              </button>
            </span>
          </div>
        ) : null}
        {error ? (
          <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {total === 0 ? (
          <AdminEmpty
            title={
              catalogEmpty
                ? "No products have been added yet."
                : "No products match your current filters."
            }
            detail={
              catalogEmpty
                ? undefined
                : "Clear a filter or try another search."
            }
          />
        ) : (
          <>
            <label className="flex items-center gap-3 border-b border-neutral-100 px-4 py-2 text-xs font-medium text-neutral-600 lg:hidden">
              <SelectAllBox
                state={pageSelection}
                disabled={selectDisabled || rowIds.length === 0}
                onChange={(on) => setPageSelected(rowIds, on)}
              />
              Select all on this page
            </label>
            <ul className="divide-y divide-neutral-100 lg:hidden">
              {rows.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={page * PAGE_SIZE + index + 1}
                  selected={picked.has(product.id ?? "")}
                  selectDisabled={selectDisabled}
                  onSelect={(on) => product.id && toggleSelected(product.id, on)}
                  pending={pendingId === product.id || (bulkBusy && picked.has(product.id ?? ""))}
                  onStock={(status) => updateRow(product, { status })}
                  onPublished={(published) => updateRow(product, { published })}
                  onDelete={() => removeRow(product)}
                />
              ))}
            </ul>
            <div className="hidden overflow-x-auto overscroll-x-contain lg:block">
              <table className="w-full border-separate border-spacing-0 text-left text-sm lg:table-fixed">
                <caption className="sr-only">Products</caption>
                <thead className="text-xs text-neutral-500">
                  <tr>
                    <th className="w-11 border-b border-neutral-200 bg-admin-subtle py-3 pr-1 pl-3 font-medium xl:sticky xl:left-0 xl:z-20 xl:w-11 xl:pl-4">
                      <SelectAllBox
                        state={pageSelection}
                        disabled={selectDisabled || rowIds.length === 0}
                        onChange={(on) => setPageSelected(rowIds, on)}
                      />
                    </th>
                    <th className="w-10 border-b border-neutral-200 bg-admin-subtle px-2 py-3 text-right font-medium xl:sticky xl:left-11 xl:z-20 xl:w-12 xl:px-4">
                      #
                    </th>
                    <th className="border-b border-neutral-200 bg-admin-subtle px-3 py-3 font-medium xl:sticky xl:left-23 xl:z-20 xl:min-w-64 xl:border-r xl:px-4">
                      Product
                    </th>
                    <th className="w-[7.25rem] border-b border-neutral-200 bg-admin-subtle px-3 py-3 font-medium xl:px-4">
                      Category
                    </th>
                    <th className="w-24 border-b border-neutral-200 bg-admin-subtle px-2 py-3 text-right font-medium xl:px-4">
                      Price
                    </th>
                    <th className="w-[6.5rem] border-b border-neutral-200 bg-admin-subtle px-3 py-3 font-medium xl:px-4">
                      Quantity
                    </th>
                    <th className="min-w-[10.5rem] border-b border-neutral-200 bg-admin-subtle px-3 py-3 font-medium lg:min-w-0 lg:w-[9.5rem] xl:px-4">
                      Stock
                    </th>
                    <th className="w-[7.5rem] border-b border-neutral-200 bg-admin-subtle px-3 py-3 font-medium xl:px-4">
                      Published
                    </th>
                    <th className="w-14 border-b border-neutral-200 bg-admin-subtle px-2 py-3 font-medium xl:px-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      index={page * PAGE_SIZE + index + 1}
                      selected={picked.has(product.id ?? "")}
                      selectDisabled={selectDisabled}
                      onSelect={(on) => product.id && toggleSelected(product.id, on)}
                      pending={pendingId === product.id || (bulkBusy && picked.has(product.id ?? ""))}
                      onStock={(next) => updateRow(product, { status: next })}
                      onPublished={(published) =>
                        updateRow(product, { published })
                      }
                      onDelete={() => removeRow(product)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <ProductsPager
              page={page}
              pageCount={pageCount}
              total={total}
              onPage={(next) => setPageState({ key: filterKey, page: next })}
            />
          </>
        )}
        {catalogEmpty ? (
          <div className="border-t border-neutral-100 px-4 py-3 text-center">
            <Link
              href="/admin/products/new"
              className={adminButtonClass.primary}
            >
              Add product
            </Link>
          </div>
        ) : null}
        {!catalogEmpty && total === 0 ? (
          <div className="border-t border-neutral-100 px-4 py-3 text-center">
            <button
              type="button"
              onClick={clearFilters}
              className={adminButtonClass.secondary}
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Metric({
  href,
  label,
  value,
  hint,
  active,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex flex-col rounded-2xl bg-white px-4 py-3 ring-1 transition-colors hover:ring-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active ? "ring-primary" : "ring-neutral-200/90",
      )}
    >
      <span className="text-sm text-neutral-600">{label}</span>
      <span className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-neutral-950">
        {value}
      </span>
      <span className="mt-1 text-xs leading-4 text-neutral-500">{hint}</span>
    </Link>
  );
}

function ActiveFilters({
  category,
  categoryName,
  status,
  visibility,
  minPrice,
  maxPrice,
  onClear,
}: {
  category: ProductCategoryId | null;
  categoryName: string;
  status: StockStatus | null;
  visibility: Visibility | null;
  minPrice: string;
  maxPrice: string;
  onClear: (key: string, value: string | null) => void;
}) {
  const chips = [
    category
      ? { key: "category", label: categoryName }
      : null,
    status ? { key: "status", label: ADMIN_STOCK_STATUS_LABEL[status] } : null,
    visibility
      ? { key: "visibility", label: visibility === "live" ? "Published" : "Draft" }
      : null,
    minPrice
      ? { key: "min", label: `Min ${formatTaka(Number(minPrice) || 0)}` }
      : null,
    maxPrice
      ? { key: "max", label: `Max ${formatTaka(Number(maxPrice) || 0)}` }
      : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => onClear(chip.key, null)}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-neutral-100 px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {chip.label}
            <MaterialIcon name="close" className="text-[14px]" />
            <span className="sr-only">Remove {chip.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function FilterTab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-800",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
          active
            ? "bg-primary/10 text-[#0b3d39]"
            : "bg-neutral-100 text-neutral-500",
        )}
      >
        {count}
      </span>
      {active ? (
        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
      ) : null}
    </Link>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle px-3 text-sm text-neutral-950 outline-none focus:border-primary focus:ring-3 focus:ring-primary/25"
      >
        {options.map((option) => (
          <option key={option.id || "all"} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterAmount({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">
        {label}
      </span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))}
        placeholder="৳"
        className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle px-3 text-sm text-neutral-950 outline-none focus:border-primary focus:ring-3 focus:ring-primary/25"
      />
    </label>
  );
}

function ProductRow({
  product,
  index,
  selected,
  selectDisabled,
  onSelect,
  pending,
  onStock,
  onPublished,
  onDelete,
}: {
  product: AdminProduct;
  index: number;
  selected: boolean;
  selectDisabled: boolean;
  onSelect: (selected: boolean) => void;
  pending: boolean;
  onStock: (status: StockStatus) => void;
  onPublished: (published: boolean) => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const href = `/admin/products/${product.id}`;
  const pinned =
    "border-b border-neutral-100 xl:sticky xl:z-10 xl:bg-white xl:group-hover:bg-neutral-50";
  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-neutral-50"
      onClick={() => router.push(href)}
    >
      <td
        className={cn(pinned, "py-3 pr-1 pl-3 xl:left-0 xl:pl-4")}
        onClick={(event) => event.stopPropagation()}
      >
        <RowSelectBox
          title={product.title}
          checked={selected}
          disabled={selectDisabled}
          onChange={onSelect}
        />
      </td>
      <td
        className={cn(
          pinned,
          "px-2 py-3 text-right text-xs tabular-nums text-neutral-500 xl:left-11 xl:px-4",
        )}
      >
        {index}
      </td>
      <td
        className={cn(
          pinned,
          "min-w-0 overflow-hidden px-3 py-3 xl:left-23 xl:min-w-64 xl:border-r xl:border-neutral-200 xl:px-4",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <ProductThumb product={product} />
          <span className="min-w-0">
            <Link
              href={href}
              className="block truncate font-semibold text-neutral-950 hover:text-primary"
              onClick={(event) => event.stopPropagation()}
            >
              {product.title}
            </Link>
            <span className="block truncate text-xs text-neutral-500">
              {product.subtitle}
            </span>
            <span className="mt-0.5 flex min-w-0 items-center gap-2">
              <span className="truncate text-xs text-neutral-500">
                {product.slug}
              </span>
              {product.featured ? (
                <span className="shrink-0 text-xs font-medium text-primary">
                  Featured
                </span>
              ) : null}
            </span>
          </span>
        </span>
      </td>
      <td className="border-b border-neutral-100 px-3 py-3 text-neutral-700 xl:px-4">
        {product.categoryPath?.map((node) => node.name).join(" › ") || product.categoryName || categoryLabel(product.categoryId)}
      </td>
      <td className="border-b border-neutral-100 px-2 py-3 text-right whitespace-nowrap xl:px-4">
        <PriceStack product={product} />
      </td>
      <td className="border-b border-neutral-100 px-3 py-3 whitespace-nowrap xl:px-4">
        <QuantityCell product={product} />
      </td>
      <td className="min-w-[10.5rem] border-b border-neutral-100 px-3 py-3 whitespace-nowrap lg:min-w-0 xl:px-4">
        <StockSelect product={product} pending={pending} onChange={onStock} />
      </td>
      <td className="border-b border-neutral-100 px-3 py-3 whitespace-nowrap xl:px-4">
        <PublishSwitch
          product={product}
          pending={pending}
          onChange={onPublished}
        />
      </td>
      <td className="border-b border-neutral-100 px-2 py-3 text-right xl:px-3">
        <DeleteProductButton product={product} pending={pending} onDelete={onDelete} />
      </td>
    </tr>
  );
}

function ProductCard({
  product,
  index,
  selected,
  selectDisabled,
  onSelect,
  pending,
  onStock,
  onPublished,
  onDelete,
}: {
  product: AdminProduct;
  index: number;
  selected: boolean;
  selectDisabled: boolean;
  onSelect: (selected: boolean) => void;
  pending: boolean;
  onStock: (status: StockStatus) => void;
  onPublished: (published: boolean) => void;
  onDelete: () => void;
}) {
  const href = `/admin/products/${product.id}`;
  return (
    <li className="px-4 py-3">
      <Link href={href} className="flex min-w-0 items-start gap-3">
        <ProductThumb product={product} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-semibold text-neutral-950">
              {product.title}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-neutral-500">
              #{index}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-neutral-500">
            {product.categoryPath?.map((node) => node.name).join(" › ") || product.categoryName || categoryLabel(product.categoryId)}
            {product.featured ? " · Featured" : ""}
          </span>
          <span className="mt-2 flex items-end justify-between gap-3">
            <PriceStack product={product} />
            <QuantityCell product={product} />
          </span>
        </span>
      </Link>
      <span className="mt-3 flex items-center justify-between gap-3">
        <span className="flex w-[3.25rem] shrink-0 justify-center">
          <RowSelectBox
            title={product.title}
            checked={selected}
            disabled={selectDisabled}
            onChange={onSelect}
          />
        </span>
        <span className="mr-auto">
          <StockSelect product={product} pending={pending} onChange={onStock} />
        </span>
        <span className="flex items-center gap-1">
          <PublishSwitch
            product={product}
            pending={pending}
            onChange={onPublished}
          />
          <DeleteProductButton product={product} pending={pending} onDelete={onDelete} />
        </span>
      </span>
    </li>
  );
}

const SELECT_BOX_CLASS =
  "size-4 cursor-pointer rounded accent-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40";

function SelectAllBox({
  state,
  disabled,
  onChange,
}: {
  state: "none" | "some" | "all";
  disabled: boolean;
  onChange: (selected: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all products on this page"
      checked={state === "all"}
      disabled={disabled}
      // A partly picked page selects the rest; a full page clears.
      onChange={() => onChange(state !== "all")}
      className={SELECT_BOX_CLASS}
    />
  );
}

function RowSelectBox({
  title,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  checked: boolean;
  disabled: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      aria-label={`Select ${title}`}
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      onClick={(event) => event.stopPropagation()}
      className={SELECT_BOX_CLASS}
    />
  );
}

function DeleteProductButton({
  product,
  pending,
  onDelete,
}: {
  product: AdminProduct;
  pending: boolean;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Delete ${product.title}`}
      title="Delete"
      disabled={pending}
      onClick={(event) => {
        // The table row opens the product on click; a delete must not navigate.
        event.preventDefault();
        event.stopPropagation();
        onDelete();
      }}
      className="inline-grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40"
    >
      <MaterialIcon name="delete" className="text-[20px]" />
    </button>
  );
}

function QuantityCell({ product }: { product: AdminProduct }) {
  if (product.quantity == null) {
    return (
      <span className="block text-right">
        <span
          className="block font-semibold tabular-nums text-neutral-500"
          aria-hidden
        >
          —
        </span>
        <span className="sr-only">No tracked quantity. </span>
        <span className="block text-xs text-neutral-500">Made to order</span>
      </span>
    );
  }
  return (
    <span className="block text-right lg:text-left">
      <span className="block font-semibold tabular-nums text-neutral-950">
        {product.quantity}
      </span>
      <span className="block text-xs text-neutral-500">
        {ADMIN_STOCK_STATUS_LABEL[product.status]}
      </span>
    </span>
  );
}

function StockSelect({
  product,
  pending,
  onChange,
}: {
  product: AdminProduct;
  pending: boolean;
  onChange: (status: StockStatus) => void;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 lg:block lg:w-full lg:min-w-0"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <select
        aria-label={`Stock for ${product.title}`}
        value={product.status}
        disabled={pending}
        onChange={(event) => onChange(event.target.value as StockStatus)}
        className={cn(
          "h-8 w-max shrink-0 cursor-pointer appearance-none rounded-full py-0 pr-6 pl-2.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:w-full lg:max-w-full",
          STOCK_STATUS_TONE[product.status],
        )}
      >
        {STOCK_FILTERS.map((status) => (
          <option key={status} value={status}>
            {ADMIN_STOCK_STATUS_LABEL[status]}
          </option>
        ))}
      </select>
      <MaterialIcon
        name="expand_more"
        className="pointer-events-none absolute top-1/2 right-0.5 -translate-y-1/2 text-[16px]"
      />
    </span>
  );
}

function PublishSwitch({
  product,
  pending,
  onChange,
}: {
  product: AdminProduct;
  pending: boolean;
  onChange: (published: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={product.published}
      aria-label={
        product.published
          ? `Move ${product.title} to draft`
          : `Publish ${product.title}`
      }
      disabled={pending}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!product.published);
      }}
      className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          product.published ? "bg-primary" : "bg-neutral-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-all",
            product.published ? "left-4" : "left-0.5",
          )}
        />
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          product.published
            ? "bg-emerald-50 text-emerald-800"
            : "bg-neutral-100 text-neutral-600",
        )}
      >
        {product.published ? "Published" : "Draft"}
      </span>
    </button>
  );
}

function ProductThumb({ product }: { product: AdminProduct }) {
  const [failed, setFailed] = useState(false);
  if (!product.imageSrc || failed) {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500 xl:size-12">
        <MaterialIcon name="image" className="text-[20px]" />
      </span>
    );
  }
  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-neutral-100 xl:size-12">
      <Image
        src={product.imageSrc}
        alt=""
        fill
        sizes="48px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function PriceStack({ product }: { product: AdminProduct }) {
  const compare =
    product.compareAtPrice != null && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : null;
  return (
    <span className="block text-right">
      <span className="block font-semibold tabular-nums text-neutral-950">
        {formatTaka(product.price)}
      </span>
      {compare != null ? (
        <span className="block text-xs text-neutral-500 line-through tabular-nums">
          {formatTaka(compare)}
        </span>
      ) : null}
    </span>
  );
}

function ProductsPager({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total <= PAGE_SIZE) return null;
  const start = page * PAGE_SIZE + 1;
  const end = Math.min(total, (page + 1) * PAGE_SIZE);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3">
      <p className="text-xs text-neutral-500">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <PagerButton
          label="Previous page"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          icon="chevron_left"
        />
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Page ${index + 1}`}
            aria-current={index === page ? "page" : undefined}
            onClick={() => onPage(index)}
            className={cn(
              "grid size-8 place-items-center rounded-full text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              index === page
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {index + 1}
          </button>
        ))}
        <PagerButton
          label="Next page"
          disabled={page >= pageCount - 1}
          onClick={() => onPage(page + 1)}
          icon="chevron_right"
        />
      </div>
    </div>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:text-neutral-300"
    >
      <MaterialIcon name={icon} className="text-[20px]" />
    </button>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading products">
      <div className="h-14 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90" />
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProductsView />
    </Suspense>
  );
}
