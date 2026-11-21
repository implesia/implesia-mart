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
import { costMargin, formatMarginTaka } from "@/lib/admin/cost-price";
import { fetchSuppliers, type Supplier } from "@/lib/mart-api/inventory";
import { percentText } from "@/lib/mart-api/pricing";
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
  const supplierId = params.get("supplier_id")?.trim() || null;
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
    Boolean(minPrice || maxPrice || visibility || supplierId),
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    fetchSuppliers({ page: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled) setSuppliers(res.items);
      })
      .catch(() => {
        /* optional supplier dropdown stays empty */
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
    supplierId,
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
      supplierId,
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
    supplierId,
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
        supplierId,
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
              supplierId,
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
                  supplierId,
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
    !supplierId &&
    !status &&
    !visibility &&
    !minPrice &&
    !maxPrice &&
    !debouncedQuery;
  const advanced = Boolean(
    supplierId ||
    minPrice ||
    maxPrice ||
    visibility ||
    sort !== "catalog" ||
    status ||
    category,
  );
  const selectedSupplierName =
    suppliers.find((s) => s.id === supplierId)?.name ?? (supplierId ? "Selected supplier" : "");
  const scoped = advanced || Boolean(query.trim());

  function clearFilters() {
    setQuery("");
    setFiltersOpen(false);
    router.replace("/admin/products", { scroll: false });
  }

  return (
    <div className="min-w-0 space-y-5">
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
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <Metric
          href={hrefWith({ status: null, visibility: null })}
          label="Products"
          value={String(metrics.total)}
          hint="In the current category"
          icon="inventory_2"
          active={!status && !visibility}
        />
        <Metric
          href={hrefWith({ visibility: "live", status: null })}
          label="Published"
          value={String(metrics.live)}
          hint="Live on the store"
          icon="check_circle"
          tone="emerald"
          active={visibility === "live"}
        />
        <Metric
          href={hrefWith({ visibility: "hidden", status: null })}
          label="Drafts"
          value={String(metrics.hidden)}
          hint="Admin only, not on the store"
          icon="edit_note"
          tone="amber"
          active={visibility === "hidden"}
        />
        <Metric
          href={hrefWith({ status: "sold-out", visibility: null })}
          label="Sold out"
          value={String(metrics.soldOut)}
          hint="Unavailable to buy"
          icon="block"
          tone="rose"
          active={status === "sold-out"}
        />
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200/90">
        {/* ─── Toolbar ─────────────────────────────────────────────── */}
  <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      {/* Search */}
      <label className="relative block min-w-0 flex-1">
        <MaterialIcon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, category, or product ID…"
          aria-label="Search products"
          className="h-10 w-full rounded-xl border border-neutral-200 bg-white pr-10 pl-10 text-sm text-neutral-950 shadow-sm outline-none transition-all placeholder:text-neutral-400 hover:border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <MaterialIcon name="close" className="text-[16px]" />
          </button>
        ) : null}
      </label>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
          className={cn(
            adminButtonClass.secondary,
            "transition-shadow",
            (supplierId || minPrice || maxPrice || visibility || status) &&
              "ring-1 ring-primary/30",
          )}
        >
          <MaterialIcon name="tune" className="text-[18px]" />
          Filters
          {supplierId || minPrice || maxPrice || visibility || status ? (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white tabular-nums">
              On
            </span>
          ) : null}
        </button>

        <label className="relative min-w-44">
          <span className="sr-only">Sort products</span>
          <select
            value={sort}
            onChange={(event) =>
              setParam(
                "sort",
                event.target.value === "catalog" ? null : event.target.value,
              )
            }
            className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-neutral-200 bg-white pl-3 pr-9 text-sm text-neutral-950 shadow-sm outline-none transition-all hover:border-neutral-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            {SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <MaterialIcon
            name="expand_more"
            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[18px] text-neutral-400"
          />
        </label>

        {scoped ? (
          <button
            type="button"
            onClick={clearFilters}
            className={cn(
              adminButtonClass.quiet,
              "text-neutral-500 hover:text-neutral-900",
            )}
          >
            <MaterialIcon name="restart_alt" className="text-[16px]" />
            Clear
          </button>
        ) : null}
      </div>
    </div>

    {/* Advanced filters */}
    {filtersOpen ? (
      <div className="grid gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 sm:grid-cols-2 xl:grid-cols-5">
        <FilterSelect
          label="Supplier"
          value={supplierId ?? ""}
          onChange={(value) => setParam("supplier_id", value || null)}
          options={[
            { id: "", label: "All suppliers" },
            ...suppliers.map((s) => ({ id: s.id, label: s.name })),
          ]}
        />
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

    {/* Active filter chips */}
    <ActiveFilters
      category={category}
      categoryName={
        trail[trail.length - 1]?.label ??
        (category ? categoryLabel(category) : "")
      }
      supplierId={supplierId}
      supplierName={selectedSupplierName}
      status={status}
      visibility={visibility}
      minPrice={minPrice}
      maxPrice={maxPrice}
      onClear={setParam}
    />
  </div>

  {/* ─── Category tabs ──────────────────────────────────────── */}
  <div
    role="tablist"
    aria-label="Categories"
    className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-2 scrollbar-thin"
  >
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

  {/* ─── Subcategory chips ──────────────────────────────────── */}
  {subChips.length > 0 ? (
    <ul
      aria-label="Subcategories"
      className="flex gap-1.5 overflow-x-auto border-b border-neutral-100 bg-neutral-50/50 px-3 py-2 scrollbar-thin"
    >
      {subChips.map((chip) => {
        const isActive = category === chip.slug;
        return (
          <li key={chip.id} className="shrink-0">
            <Link
              href={hrefWith({ category: chip.slug })}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:-translate-y-0.5 hover:bg-neutral-50 hover:shadow-sm",
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-neutral-100 text-neutral-500",
                )}
              >
                {chip.subtreeProductCount}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  ) : null}

  {/* ─── Bulk selection bar ─────────────────────────────────── */}
  {selectedIds.length > 0 ? (
    <div
      role="region"
      aria-label="Selected products"
      className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary/[0.06] px-4 py-2.5 shadow-sm backdrop-blur sm:px-5"
    >
      <p
        className="flex items-center gap-2 text-sm font-medium text-neutral-900"
        role="status"
        aria-live="polite"
      >
        <span className="grid size-5 place-items-center rounded-full bg-primary text-white">
          <MaterialIcon name="check" className="text-[14px]" />
        </span>
        <span className="tabular-nums">{selectedIds.length}</span>
        <span className="text-neutral-600">selected</span>
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
            "text-red-700 ring-1 ring-red-200 hover:bg-red-50 hover:ring-red-300 focus-visible:ring-2 focus-visible:ring-red-300",
          )}
        >
          <MaterialIcon name="delete" className="text-[18px]" />
          {bulkBusy ? "Deleting…" : "Delete selected"}
        </button>
      </span>
    </div>
  ) : null}

  {/* ─── Error banner ───────────────────────────────────────── */}
  {error ? (
    <div
      role="alert"
      className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700 sm:px-5"
    >
      <MaterialIcon
        name="error"
        className="mt-0.5 shrink-0 text-[18px] text-red-600"
      />
      <p className="flex-1">{error}</p>
    </div>
  ) : null}

  {/* ─── Empty vs Table ─────────────────────────────────────── */}
  {total === 0 ? (
    <div className="p-6 sm:p-8">
      <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/40 p-6 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-neutral-100 text-neutral-400">
          <MaterialIcon
            name={catalogEmpty ? "inventory_2" : "search_off"}
            className="text-[24px]"
          />
        </div>
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
        <div className="mt-4 flex justify-center gap-2">
          {catalogEmpty ? (
            <Link
              href="/admin/products/new"
              className={adminButtonClass.primary}
            >
              <MaterialIcon name="add" className="text-[18px]" />
              Add product
            </Link>
          ) : (
            <button
              type="button"
              onClick={clearFilters}
              className={adminButtonClass.secondary}
            >
              <MaterialIcon name="restart_alt" className="text-[16px]" />
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  ) : (
    <>
      {/* Mobile select-all */}
      <label className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5 text-xs font-medium text-neutral-600 lg:hidden">
        <SelectAllBox
          state={pageSelection}
          disabled={selectDisabled || rowIds.length === 0}
          onChange={(on) => setPageSelected(rowIds, on)}
        />
        Select all on this page
        <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] tabular-nums text-neutral-600">
          {rowIds.length}
        </span>
      </label>

      {/* Mobile cards */}
      <ul className="divide-y divide-neutral-100 lg:hidden">
        {rows.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={page * PAGE_SIZE + index + 1}
            selected={picked.has(product.id ?? "")}
            selectDisabled={selectDisabled}
            onSelect={(on) => product.id && toggleSelected(product.id, on)}
            pending={
              pendingId === product.id ||
              (bulkBusy && picked.has(product.id ?? ""))
            }
            onStock={(status) => updateRow(product, { status })}
            onPublished={(published) => updateRow(product, { published })}
            onDelete={() => removeRow(product)}
          />
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto overscroll-x-contain lg:block">
        <table className="w-full border-separate border-spacing-0 text-left text-sm lg:table-fixed">
          <caption className="sr-only">Products</caption>
          <thead className="text-xs text-neutral-500">
            <tr>
              <th className="w-11 border-b-2 border-neutral-200 bg-neutral-50/80 py-3 pr-1 pl-3 font-medium xl:sticky xl:left-0 xl:z-20 xl:w-11 xl:pl-4 xl:backdrop-blur">
                <SelectAllBox
                  state={pageSelection}
                  disabled={selectDisabled || rowIds.length === 0}
                  onChange={(on) => setPageSelected(rowIds, on)}
                />
              </th>
              <th className="w-10 border-b-2 border-neutral-200 bg-neutral-50/80 px-2 py-3 text-right font-medium xl:sticky xl:left-11 xl:z-20 xl:w-12 xl:px-4 xl:backdrop-blur">
                #
              </th>
              <th className="border-b-2 border-neutral-200 bg-neutral-50/80 px-3 py-3 font-medium xl:sticky xl:left-23 xl:z-20 xl:min-w-64 xl:border-r xl:px-4 xl:backdrop-blur">
                Product
              </th>
              <th className="w-[7.25rem] border-b-2 border-neutral-200 bg-neutral-50/80 px-3 py-3 font-medium xl:px-4">
                Category
              </th>
              <th className="w-36 border-b-2 border-neutral-200 bg-neutral-50/80 px-2 py-3 text-right font-medium xl:px-4">
                Price &amp; Margin
              </th>
              <th className="w-[6.5rem] border-b-2 border-neutral-200 bg-neutral-50/80 px-3 py-3 font-medium xl:px-4">
                Quantity
              </th>
              <th className="min-w-[10.5rem] border-b-2 border-neutral-200 bg-neutral-50/80 px-3 py-3 font-medium lg:min-w-0 lg:w-[9.5rem] xl:px-4">
                Stock
              </th>
              <th className="w-[7.5rem] border-b-2 border-neutral-200 bg-neutral-50/80 px-3 py-3 font-medium xl:px-4">
                Published
              </th>
              <th className="w-32 border-b-2 border-neutral-200 bg-neutral-50/95 px-3 py-3 text-right font-medium xl:sticky xl:right-0 xl:z-20 xl:border-l xl:border-neutral-200 xl:backdrop-blur">
                Actions
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
                pending={
                  pendingId === product.id ||
                  (bulkBusy && picked.has(product.id ?? ""))
                }
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

      {/* Pager */}
      <ProductsPager
        page={page}
        pageCount={pageCount}
        total={total}
        onPage={(next) => setPageState({ key: filterKey, page: next })}
      />
    </>
  )}
      </section>
    </div>
  );
}

function Metric({
  href,
  label,
  value,
  hint,
  icon,
  tone = "primary",
  active,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone?: "primary" | "emerald" | "amber" | "rose";
  active?: boolean;
}) {
  const tones = {
    primary: {
      iconWrap: "bg-primary/10 text-primary ring-primary/15",
      activeIconWrap: "bg-primary text-white ring-primary/30",
      accent: "bg-primary",
      activeCard: "ring-primary/40 bg-primary/[0.03]",
    },
    emerald: {
      iconWrap: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
      activeIconWrap: "bg-emerald-600 text-white ring-emerald-300",
      accent: "bg-emerald-500",
      activeCard: "ring-emerald-300 bg-emerald-50/40",
    },
    amber: {
      iconWrap: "bg-amber-50 text-amber-700 ring-amber-200/60",
      activeIconWrap: "bg-amber-500 text-white ring-amber-300",
      accent: "bg-amber-500",
      activeCard: "ring-amber-300 bg-amber-50/40",
    },
    rose: {
      iconWrap: "bg-rose-50 text-rose-700 ring-rose-200/60",
      activeIconWrap: "bg-rose-600 text-white ring-rose-300",
      accent: "bg-rose-500",
      activeCard: "ring-rose-300 bg-rose-50/40",
    },
  } as const;

  const t = tones[tone];

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 transition-all duration-150",
        "hover:-translate-y-0.5 hover:shadow-md hover:ring-neutral-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        active ? t.activeCard : "ring-neutral-200/90",
      )}
    >
      {/* Top accent bar — only when active */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] transition-opacity",
          t.accent,
          active ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Header row: icon + label */}
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors duration-150",
            active ? t.activeIconWrap : t.iconWrap,
          )}
        >
          <MaterialIcon name={icon} className="text-[18px]" />
        </span>
        <span className="truncate text-[13px] font-medium tracking-wide text-neutral-600">
          {label}
        </span>
      </span>

      {/* Value */}
      <span className="mt-3 text-[28px] leading-none font-semibold tracking-tight tabular-nums text-neutral-950">
        {value}
      </span>

      {/* Hint */}
      <span className="mt-1.5 line-clamp-1 text-xs leading-4 text-neutral-500">
        {hint}
      </span>
    </Link>
  );
}

function ActiveFilters({
  category,
  categoryName,
  supplierId,
  supplierName,
  status,
  visibility,
  minPrice,
  maxPrice,
  onClear,
}: {
  category: ProductCategoryId | null;
  categoryName: string;
  supplierId: string | null;
  supplierName: string;
  status: StockStatus | null;
  visibility: Visibility | null;
  minPrice: string;
  maxPrice: string;
  onClear: (key: string, value: string | null) => void;
}) {
  type FilterChip = {
    key: string;
    label: string;
    caption: string;
    icon: string;
    tone: "neutral" | "emerald" | "blue" | "violet";
  };

  const chips: FilterChip[] = (
    [
      category
        ? {
            key: "category",
            label: categoryName,
            caption: "Category",
            icon: "sell",
            tone: "neutral" as const,
          }
        : null,
      supplierId
        ? {
            key: "supplier_id",
            label: supplierName,
            caption: "Supplier",
            icon: "handshake",
            tone: "emerald" as const,
          }
        : null,
      status
        ? {
            key: "status",
            label: ADMIN_STOCK_STATUS_LABEL[status],
            caption: "Stock",
            icon: "inventory_2",
            tone: "emerald" as const,
          }
        : null,
      visibility
        ? {
            key: "visibility",
            label: visibility === "live" ? "Published" : "Draft",
            caption: "Visibility",
            icon: visibility === "live" ? "visibility" : "visibility_off",
            tone: "blue" as const,
          }
        : null,
      minPrice
        ? {
            key: "min",
            label: formatTaka(Number(minPrice) || 0),
            caption: "Min price",
            icon: "payments",
            tone: "violet" as const,
          }
        : null,
      maxPrice
        ? {
            key: "max",
            label: formatTaka(Number(maxPrice) || 0),
            caption: "Max price",
            icon: "payments",
            tone: "violet" as const,
          }
        : null,
    ] as (FilterChip | null)[]
  ).filter((chip): chip is FilterChip => Boolean(chip));

  if (chips.length === 0) return null;

  const tones = {
    neutral: {
      chip: "bg-white ring-neutral-200 hover:ring-neutral-300",
      icon: "bg-neutral-100 text-neutral-600",
      hoverRemove: "group-hover/chip:bg-neutral-900 group-hover/chip:text-white",
    },
    emerald: {
      chip: "bg-emerald-50/60 ring-emerald-200/70 hover:ring-emerald-300",
      icon: "bg-emerald-100 text-emerald-700",
      hoverRemove: "group-hover/chip:bg-emerald-600 group-hover/chip:text-white",
    },
    blue: {
      chip: "bg-sky-50/60 ring-sky-200/70 hover:ring-sky-300",
      icon: "bg-sky-100 text-sky-700",
      hoverRemove: "group-hover/chip:bg-sky-600 group-hover/chip:text-white",
    },
    violet: {
      chip: "bg-violet-50/60 ring-violet-200/70 hover:ring-violet-300",
      icon: "bg-violet-100 text-violet-700",
      hoverRemove: "group-hover/chip:bg-violet-600 group-hover/chip:text-white",
    },
  } as const;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Active filters"
    >
      <ul className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => {
          const t = tones[chip.tone];
          return (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => onClear(chip.key, null)}
                title={`Remove ${chip.caption}: ${chip.label}`}
                className={cn(
                  "group/chip inline-flex h-8 items-center gap-1.5 rounded-full pl-1 pr-1.5 text-xs font-medium ring-1 transition-all hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                  t.chip,
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full transition-colors",
                    t.icon,
                  )}
                  aria-hidden
                >
                  <MaterialIcon name={chip.icon} className="text-[14px]" />
                </span>
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {chip.caption}
                  </span>
                  <span className="text-neutral-900">{chip.label}</span>
                </span>
                <span
                  className={cn(
                    "ml-0.5 grid size-5 place-items-center rounded-full bg-neutral-200/70 text-neutral-600 transition-colors",
                    t.hoverRemove,
                  )}
                  aria-hidden
                >
                  <MaterialIcon name="close" className="text-[13px]" />
                </span>
                <span className="sr-only">
                  Remove {chip.caption} filter: {chip.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {chips.length > 1 ? (
        <button
          type="button"
          onClick={() => {
            for (const chip of chips) onClear(chip.key, null);
          }}
          className="ml-1 inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <MaterialIcon name="restart_alt" className="text-[14px]" />
          Clear all
        </button>
      ) : null}
    </div>
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
        "group/tab relative inline-flex shrink-0 items-center gap-2 rounded-t-lg px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "text-neutral-950"
          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums transition-colors",
          active
            ? "bg-primary/10 text-[#0b3d39]"
            : "bg-neutral-100 text-neutral-500 group-hover/tab:bg-neutral-200",
        )}
      >
        {count}
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary transition-transform duration-200",
          active ? "scale-x-100" : "scale-x-0 group-hover/tab:scale-x-50",
        )}
      />
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
        className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle px-3 text-sm text-neutral-950 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
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
        className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle px-3 text-sm text-neutral-950 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
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
  const viewHref = `/admin/products/${product.id}/view`;
  const editHref = `/admin/products/${product.id}`;
  const pinned =
    "border-b border-neutral-100 xl:sticky xl:z-10 xl:bg-white xl:group-hover:bg-neutral-50 xl:group-data-[selected=true]:bg-primary/5";
  return (
    <tr
      data-selected={selected}
      className={cn(
        "group cursor-pointer transition-colors",
        selected ? "bg-primary/5" : "hover:bg-neutral-50",
      )}
      onClick={() => router.push(viewHref)}
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
              href={viewHref}
              className="block truncate font-semibold text-neutral-950 transition-colors hover:text-primary"
              onClick={(event) => event.stopPropagation()}
            >
              {product.title}
            </Link>
            <span className="block truncate text-xs text-neutral-500">
              {product.subtitle}
            </span>
            <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="truncate text-xs text-neutral-400">
                {product.slug}
              </span>
              {product.supplierName ? (
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {product.supplierName}
                </span>
              ) : null}
              {product.featured ? (
                <span className="shrink-0 rounded-full bg-amber-50 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Featured
                </span>
              ) : null}
            </span>
          </span>
        </span>
      </td>
      <td className="border-b border-neutral-100 px-3 py-3 text-neutral-700 xl:px-4">
        <span className="line-clamp-2">
          {product.categoryPath?.map((node) => node.name).join(" › ") || product.categoryName || categoryLabel(product.categoryId)}
        </span>
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
      <td
        className={cn(
          pinned,
          "px-2 py-3 text-right whitespace-nowrap xl:right-0 xl:border-l xl:border-neutral-200 xl:px-3",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <ProductRowActions
          product={product}
          viewHref={viewHref}
          editHref={editHref}
          pending={pending}
          onDelete={onDelete}
        />
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
  const viewHref = `/admin/products/${product.id}/view`;
  const editHref = `/admin/products/${product.id}`;
  return (
    <li className={cn("px-3 py-2", selected && "bg-primary/5")}>
      <div
        className={cn(
          "rounded-xl p-3 transition-shadow",
          selected ? "ring-1 ring-primary/30" : "hover:bg-neutral-50/80",
        )}
      >
        <Link href={viewHref} className="flex min-w-0 items-start gap-3">
          <ProductThumb product={product} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate font-semibold text-neutral-950">
                {product.title}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-neutral-400">
                #{index}
              </span>
            </span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500">
              {product.categoryPath?.map((node) => node.name).join(" › ") || product.categoryName || categoryLabel(product.categoryId)}
              {product.supplierName ? ` · ${product.supplierName}` : ""}
              {product.featured ? " · Featured" : ""}
            </span>
            <span className="mt-2 flex items-end justify-between gap-3">
              <PriceStack product={product} />
              <QuantityCell product={product} />
            </span>
          </span>
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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
            <ProductRowActions
              product={product}
              viewHref={viewHref}
              editHref={editHref}
              pending={pending}
              onDelete={onDelete}
            />
          </span>
        </div>
      </div>
    </li>
  );
}

const SELECT_BOX_CLASS =
  "size-4 cursor-pointer rounded accent-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

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

function ProductRowActions({
  product,
  viewHref,
  editHref,
  pending,
  onDelete,
}: {
  product: AdminProduct;
  viewHref: string;
  editHref: string;
  pending: boolean;
  onDelete: () => void;
}) {
  return (
    <span className="inline-flex items-center justify-end gap-0.5">
      <Link
        href={viewHref}
        title="View details"
        aria-label={`View ${product.title}`}
        onClick={(event) => event.stopPropagation()}
        className="inline-grid size-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <MaterialIcon name="visibility" className="text-[18px]" />
      </Link>
      <Link
        href={editHref}
        title="Edit product"
        aria-label={`Edit ${product.title}`}
        onClick={(event) => event.stopPropagation()}
        className="inline-grid size-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      >
        <MaterialIcon name="edit" className="text-[18px]" />
      </Link>
      <button
        type="button"
        aria-label={`Delete ${product.title}`}
        title="Delete product"
        disabled={pending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete();
        }}
        className="inline-grid size-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40"
      >
        <MaterialIcon name="delete" className="text-[18px]" />
      </button>
    </span>
  );
}

function QuantityCell({ product }: { product: AdminProduct }) {
  if (product.quantity == null) {
    return (
      <span className="block text-right">
        <span
          className="block font-semibold tabular-nums text-neutral-400"
          aria-hidden
        >
          —
        </span>
        <span className="sr-only">No tracked quantity. </span>
        <span className="block text-xs text-neutral-400">Made to order</span>
      </span>
    );
  }
  const low = product.quantity > 0 && product.quantity <= 5;
  return (
    <span className="block text-right lg:text-left">
      <span
        className={cn(
          "block font-semibold tabular-nums",
          low ? "text-amber-700" : "text-neutral-950",
        )}
      >
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
  const dotTone = {
    available: "bg-emerald-500",
    "sold-out": "bg-rose-500",
    "coming-soon": "bg-amber-500",
  } as const;

  return (
    <span
      className="relative inline-flex shrink-0 lg:block lg:w-full lg:min-w-0"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-2.5 z-10 size-1.5 -translate-y-1/2 rounded-full",
          dotTone[product.status],
        )}
      />
      <select
        aria-label={`Stock for ${product.title}`}
        value={product.status}
        disabled={pending}
        onChange={(event) => onChange(event.target.value as StockStatus)}
        className={cn(
          "h-8 w-max shrink-0 cursor-pointer appearance-none rounded-full py-0 pr-6 pl-5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 lg:w-full lg:max-w-full",
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
        className="pointer-events-none absolute top-1/2 right-0.5 -translate-y-1/2 text-[16px] opacity-60"
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
      className="group/switch inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-full"
    >
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          product.published ? "bg-emerald-500" : "bg-neutral-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all",
            product.published ? "left-4" : "left-0.5",
          )}
        />
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold transition-colors",
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
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/60 xl:size-12">
        <MaterialIcon name="image" className="text-[20px]" />
      </span>
    );
  }
  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200/60 xl:size-12">
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
  const cost = product.costPrice ?? null;
  const margin = cost != null ? costMargin(product.price, cost) : null;
  return (
    <span className="block text-right">
      <span className="flex items-baseline justify-end gap-1.5">
        <span className="font-semibold tabular-nums text-neutral-950">
          {formatTaka(product.price)}
        </span>
        {compare != null ? (
          <span className="text-[11px] text-neutral-400 line-through tabular-nums">
            {formatTaka(compare)}
          </span>
        ) : null}
      </span>
      {cost != null ? (
        <span className="mt-0.5 block text-[11px] tabular-nums text-neutral-500">
          Cost {formatMarginTaka(cost)}
        </span>
      ) : (
        <span className="mt-0.5 block text-[10px] font-medium text-amber-600">
          No cost set
        </span>
      )}
      {margin ? (
        <span
          className={cn(
            "mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
            margin.profit < 0
              ? "bg-rose-50 text-rose-700"
              : margin.profit > 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-neutral-100 text-neutral-600",
          )}
        >
          {margin.profit < 0 ? "Loss " : "+"}
          {formatMarginTaka(margin.profit)}
          {margin.percent != null ? ` (${percentText(Math.abs(margin.percent))}%)` : ""}
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

  // Windowed page numbers: always show first, last, current ±1, with ellipses.
  const pages: (number | "ellipsis-l" | "ellipsis-r")[] = [];
  const push = (value: number | "ellipsis-l" | "ellipsis-r") => pages.push(value);
  const window = 1;
  for (let i = 0; i < pageCount; i++) {
    const isEdge = i === 0 || i === pageCount - 1;
    const isNear = Math.abs(i - page) <= window;
    if (isEdge || isNear) push(i);
    else if (pages[pages.length - 1] !== "ellipsis-l" && i < page) push("ellipsis-l");
    else if (pages[pages.length - 1] !== "ellipsis-r" && i > page) push("ellipsis-r");
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row">
      <p className="text-xs tabular-nums text-neutral-500">
        Showing <span className="font-medium text-neutral-700">{start}–{end}</span> of{" "}
        <span className="font-medium text-neutral-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <PagerButton
          label="Previous page"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          icon="chevron_left"
        />
        {pages.map((item, index) => {
          if (item === "ellipsis-l" || item === "ellipsis-r") {
            return (
              <span
                key={`${item}-${index}`}
                aria-hidden
                className="grid size-8 place-items-center text-sm text-neutral-400"
              >
                …
              </span>
            );
          }
          return (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item + 1}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPage(item)}
              className={cn(
                "grid size-8 place-items-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                item === page
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              {item + 1}
            </button>
          );
        })}
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
      className="grid size-8 place-items-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
    >
      <MaterialIcon name={icon} className="text-[20px]" />
    </button>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading products">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-neutral-200/70" />
          <div className="h-3.5 w-72 animate-pulse rounded bg-neutral-200/50" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-200/70" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-[104px] animate-pulse rounded-2xl bg-white ring-1 ring-neutral-200/90"
          >
            <div className="space-y-2 p-4">
              <div className="h-3.5 w-24 rounded bg-neutral-200/70" />
              <div className="h-7 w-16 rounded bg-neutral-200/60" />
              <div className="h-3 w-32 rounded bg-neutral-200/40" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white ring-1 ring-neutral-200/90">
        <div className="border-b border-neutral-100 p-4">
          <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-200/50" />
        </div>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              <div className="size-10 animate-pulse rounded-xl bg-neutral-200/60" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-neutral-200/60" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-neutral-200/40" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200/50" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-200/50" />
            </div>
          ))}
        </div>
      </div>
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