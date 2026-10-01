"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import type { ProductCategoryId } from "@/app/(client)/_data/products/products";
import { useAdminProducts } from "@/lib/mart-mock/hooks";
import {
  formatTaka,
  saveAdminProduct,
  type AdminProduct,
  type StockStatus,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_CATEGORY_LABEL,
  ADMIN_STOCK_STATUS_LABEL,
  AdminEmpty,
  AdminLoading,
  AdminPageHeader,
  adminButtonClass,
  STOCK_STATUS_TONE,
} from "../_components/admin-ui";

const PAGE_SIZE = 10;
const CATEGORIES: ProductCategoryId[] = ["gadgets", "fashion"];
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
  return value === "gadgets" || value === "fashion";
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
  const products = useAdminProducts();
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
  const [filtersOpen, setFiltersOpen] = useState(
    Boolean(minPrice || maxPrice || visibility),
  );
  const [pageState, setPageState] = useState({ key: "", page: 0 });

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

  if (!products) return <ProductsSkeleton />;

  const inCategory = category
    ? products.filter((product) => product.categoryId === category)
    : products;
  const priced = inCategory.filter(
    (product) =>
      inPrice(product, minPrice, maxPrice) && inVisibility(product, visibility),
  );
  const pool = status
    ? priced.filter((product) => product.status === status)
    : priced;
  const categoryCounts = {
    all: products.filter(
      (product) =>
        inPrice(product, minPrice, maxPrice) &&
        inVisibility(product, visibility) &&
        (!status || product.status === status),
    ).length,
    gadgets: products.filter(
      (product) =>
        product.categoryId === "gadgets" &&
        inPrice(product, minPrice, maxPrice) &&
        inVisibility(product, visibility) &&
        (!status || product.status === status),
    ).length,
    fashion: products.filter(
      (product) =>
        product.categoryId === "fashion" &&
        inPrice(product, minPrice, maxPrice) &&
        inVisibility(product, visibility) &&
        (!status || product.status === status),
    ).length,
  };
  const needle = query.trim().toLowerCase();
  const matched = pool.filter((product) => {
    if (!needle) return true;
    return [
      product.title,
      product.subtitle,
      product.slug,
      ADMIN_CATEGORY_LABEL[product.categoryId],
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
  const visible =
    sort === "catalog"
      ? matched
      : [...matched].sort((a, b) => compareProducts(a, b, sort));
  const filterKey = `${params.toString()}|${query}`;
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const storedPage = pageState.key === filterKey ? pageState.page : 0;
  const page = Math.min(storedPage, pageCount - 1);
  const pageRows = visible.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );
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
          value={String(inCategory.length)}
          hint="In the current category"
          active={!status && !visibility}
        />
        <Metric
          href={hrefWith({ visibility: "live", status: null })}
          label="Live"
          value={String(
            inCategory.filter((product) => product.published).length,
          )}
          hint="Published on the store"
          active={visibility === "live"}
        />
        <Metric
          href={hrefWith({ visibility: "hidden", status: null })}
          label="Hidden"
          value={String(
            inCategory.filter((product) => !product.published).length,
          )}
          hint="Saved, not on the store"
          active={visibility === "hidden"}
        />
        <Metric
          href={hrefWith({ status: "sold-out", visibility: null })}
          label="Sold out"
          value={String(
            inCategory.filter((product) => product.status === "sold-out")
              .length,
          )}
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
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, category, or product id"
                aria-label="Search products"
                className="h-10 w-full rounded-xl border border-neutral-200 bg-admin-subtle pr-10 pl-10 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
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
                label="Visibility"
                value={visibility ?? ""}
                onChange={(value) =>
                  setParam("visibility", isVisibility(value) ? value : null)
                }
                options={[
                  { id: "", label: "Live and hidden" },
                  { id: "live", label: "Live" },
                  { id: "hidden", label: "Hidden" },
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
          {CATEGORIES.map((id) => (
            <FilterTab
              key={id}
              href={hrefWith({ category: id })}
              label={ADMIN_CATEGORY_LABEL[id]}
              count={categoryCounts[id]}
              active={category === id}
            />
          ))}
        </div>

        {visible.length === 0 ? (
          <AdminEmpty
            title={
              products.length === 0
                ? "No products have been added yet."
                : "No products match your current filters."
            }
            detail={
              products.length === 0
                ? undefined
                : "Clear a filter or try another search."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-neutral-100 lg:hidden">
              {pageRows.map((product, index) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  index={page * PAGE_SIZE + index + 1}
                />
              ))}
            </ul>
            <div className="hidden overflow-x-auto overscroll-x-contain lg:block">
              <table className="w-full border-separate border-spacing-0 text-left text-sm lg:table-fixed">
                <caption className="sr-only">Products</caption>
                <thead className="text-xs text-neutral-500">
                  <tr>
                    <th className="w-10 border-b border-neutral-200 bg-admin-subtle px-2 py-3 text-right font-medium xl:sticky xl:left-0 xl:z-20 xl:w-12 xl:px-4">
                      #
                    </th>
                    <th className="border-b border-neutral-200 bg-admin-subtle px-3 py-3 font-medium xl:sticky xl:left-12 xl:z-20 xl:min-w-64 xl:border-r xl:px-4">
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
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((product, index) => (
                    <ProductRow
                      key={product.slug}
                      product={product}
                      index={page * PAGE_SIZE + index + 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <ProductsPager
              page={page}
              pageCount={pageCount}
              total={visible.length}
              onPage={(next) => setPageState({ key: filterKey, page: next })}
            />
          </>
        )}
        {products.length === 0 ? (
          <div className="border-t border-neutral-100 px-4 py-3 text-center">
            <Link
              href="/admin/products/new"
              className={adminButtonClass.primary}
            >
              Add product
            </Link>
          </div>
        ) : null}
        {products.length > 0 && visible.length === 0 ? (
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
  status,
  visibility,
  minPrice,
  maxPrice,
  onClear,
}: {
  category: ProductCategoryId | null;
  status: StockStatus | null;
  visibility: Visibility | null;
  minPrice: string;
  maxPrice: string;
  onClear: (key: string, value: string | null) => void;
}) {
  const chips = [
    category
      ? { key: "category", label: ADMIN_CATEGORY_LABEL[category] }
      : null,
    status ? { key: "status", label: ADMIN_STOCK_STATUS_LABEL[status] } : null,
    visibility
      ? { key: "visibility", label: visibility === "live" ? "Live" : "Hidden" }
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
}: {
  product: AdminProduct;
  index: number;
}) {
  const router = useRouter();
  const href = `/admin/products/${product.slug}`;
  const pinned =
    "border-b border-neutral-100 xl:sticky xl:z-10 xl:bg-white xl:group-hover:bg-neutral-50";
  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-neutral-50"
      onClick={() => router.push(href)}
    >
      <td
        className={cn(
          pinned,
          "px-2 py-3 text-right text-xs tabular-nums text-neutral-400 xl:left-0 xl:px-4",
        )}
      >
        {index}
      </td>
      <td
        className={cn(
          pinned,
          "min-w-0 overflow-hidden px-3 py-3 xl:left-12 xl:min-w-64 xl:border-r xl:border-neutral-200 xl:px-4",
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
              <span className="truncate text-xs text-neutral-400">
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
        {ADMIN_CATEGORY_LABEL[product.categoryId]}
      </td>
      <td className="border-b border-neutral-100 px-2 py-3 text-right whitespace-nowrap xl:px-4">
        <PriceStack product={product} />
      </td>
      <td className="border-b border-neutral-100 px-3 py-3 whitespace-nowrap xl:px-4">
        <QuantityCell product={product} />
      </td>
      <td className="min-w-[10.5rem] border-b border-neutral-100 px-3 py-3 whitespace-nowrap lg:min-w-0 xl:px-4">
        <StockSelect product={product} />
      </td>
      <td className="border-b border-neutral-100 px-3 py-3 whitespace-nowrap xl:px-4">
        <PublishSwitch product={product} />
      </td>
    </tr>
  );
}

function ProductCard({
  product,
  index,
}: {
  product: AdminProduct;
  index: number;
}) {
  const href = `/admin/products/${product.slug}`;
  return (
    <li className="px-4 py-3">
      <Link href={href} className="flex min-w-0 items-start gap-3">
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
            {ADMIN_CATEGORY_LABEL[product.categoryId]}
            {product.featured ? " · Featured" : ""}
          </span>
          <span className="mt-2 flex items-end justify-between gap-3">
            <PriceStack product={product} />
            <QuantityCell product={product} />
          </span>
        </span>
      </Link>
      <span className="mt-3 flex items-center justify-between gap-3 pl-[3.25rem]">
        <StockSelect product={product} />
        <PublishSwitch product={product} />
      </span>
    </li>
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

function StockSelect({ product }: { product: AdminProduct }) {
  return (
    <span
      className="relative inline-flex shrink-0 lg:block lg:w-full lg:min-w-0"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <select
        aria-label={`Stock for ${product.title}`}
        value={product.status}
        onChange={(event) =>
          saveAdminProduct({
            ...product,
            status: event.target.value as StockStatus,
          })
        }
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

function PublishSwitch({ product }: { product: AdminProduct }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={product.published}
      aria-label={
        product.published ? `Hide ${product.title}` : `Publish ${product.title}`
      }
      onClick={(event) => {
        event.stopPropagation();
        saveAdminProduct({ ...product, published: !product.published });
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
          "text-xs font-medium",
          product.published ? "text-neutral-800" : "text-neutral-400",
        )}
      >
        {product.published ? "Live" : "Hidden"}
      </span>
    </button>
  );
}

function ProductThumb({ product }: { product: AdminProduct }) {
  const [failed, setFailed] = useState(false);
  if (!product.imageSrc || failed) {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-400 xl:size-12">
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
        <span className="block text-xs text-neutral-400 line-through tabular-nums">
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

function inPrice(product: AdminProduct, minPrice: string, maxPrice: string) {
  const min = minPrice ? Number(minPrice) : null;
  const max = maxPrice ? Number(maxPrice) : null;
  if (min != null && Number.isFinite(min) && product.price < min) return false;
  if (max != null && Number.isFinite(max) && product.price > max) return false;
  return true;
}

function inVisibility(product: AdminProduct, visibility: Visibility | null) {
  if (visibility === "live") return product.published;
  if (visibility === "hidden") return !product.published;
  return true;
}

function compareProducts(a: AdminProduct, b: AdminProduct, sort: SortId) {
  if (sort === "name-asc") return a.title.localeCompare(b.title);
  if (sort === "name-desc") return b.title.localeCompare(a.title);
  if (sort === "price-asc") return a.price - b.price;
  if (sort === "price-desc") return b.price - a.price;
  if (sort === "stock-asc") return stockRank(a) - stockRank(b);
  if (sort === "stock-desc") return stockRank(b) - stockRank(a);
  return 0;
}

function stockRank(product: AdminProduct) {
  if (product.status === "sold-out") return 0;
  if (product.quantity == null) return Number.POSITIVE_INFINITY;
  return product.quantity;
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProductsView />
    </Suspense>
  );
}
