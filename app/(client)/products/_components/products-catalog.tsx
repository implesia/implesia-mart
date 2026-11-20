"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CategoryTile } from "@/lib/mart-api/categories";
import { categoryTrail } from "@/lib/mart-api/category-tree";
import {
  CATALOG_PAGE_SIZE,
  catalogHref,
  DEFAULT_CATALOG_STATUSES,
  isUnfilteredCatalog,
  type CatalogSearch,
} from "@/lib/mart-api/catalog-query";
import { cn } from "@/lib/utils";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  categoryLabel,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  type CatalogView,
  type Product,
  type ProductCategoryId,
  type ProductStatus,
} from "../../_data/products/catalog-meta";
import { ProductBreadcrumbs } from "./product-breadcrumbs";
import { ProductsFilters, ProductsMobileFilters } from "./products-filters";
import { ProductsGrid } from "./products-grid";
import { ProductsToolbar } from "./products-toolbar";

const VIEW_LABEL: Record<CatalogView, string> = {
  featured: "Featured Products",
  latest: "Latest Products",
  new: "New Arrivals",
};

function formatTaka(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

type ProductsCatalogProps = {
  search: CatalogSearch;
  title: string;
  products: Product[];
  total: number;
  page: number;
  pages: number;
  /** Visible categories from the API (depth-first); empty when the API could not supply them. */
  categoryTree: CategoryTile[];
  availabilityCounts: Record<ProductStatus, number>;
};

export function ProductsCatalog({
  search,
  title,
  products,
  total,
  page,
  pages,
  categoryTree,
  availabilityCounts,
}: ProductsCatalogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const unfiltered = isUnfilteredCatalog(search);

  function go(next: CatalogSearch) {
    startTransition(() => {
      router.push(catalogHref(next));
    });
  }

  function patch(partial: Partial<CatalogSearch>, keepPage = false) {
    go({
      ...search,
      ...partial,
      page: keepPage ? (partial.page ?? search.page) : 1,
    });
  }

  const sliderRange: [number, number] = [
    search.minPrice ?? PRICE_FILTER_MIN,
    search.maxPrice ?? PRICE_FILTER_MAX,
  ];

  const selectCategory = (id: ProductCategoryId | "all") => {
    patch({
      category: id === "all" ? undefined : id,
      view: undefined,
    });
  };

  const toggleAvailability = (id: ProductStatus) => {
    const next = search.statuses.includes(id)
      ? search.statuses.filter((status) => status !== id)
      : [...search.statuses, id];
    patch({ statuses: next });
  };

  const commitPrice = (range: [number, number]) => {
    const min = range[0] <= PRICE_FILTER_MIN ? null : range[0];
    const max = range[1] >= PRICE_FILTER_MAX ? null : range[1];
    if (min === search.minPrice && max === search.maxPrice) return;
    patch({ minPrice: min, maxPrice: max });
  };

  const priceDirty = search.minPrice != null || search.maxPrice != null;
  const comingSoonOn = search.statuses.includes("coming-soon");
  const trail = search.category ? categoryTrail(categoryTree, search.category) : [];
  const categoryChip = search.category
    ? (trail[trail.length - 1]?.label ?? categoryLabel(search.category))
    : null;
  const viewChip = search.view ? VIEW_LABEL[search.view] : null;

  const activeFilterCount =
    (search.q ? 1 : 0) +
    (viewChip ? 1 : 0) +
    (categoryChip ? 1 : 0) +
    (comingSoonOn ? 1 : 0) +
    (priceDirty ? 1 : 0);

  const showActiveFilters = activeFilterCount > 0;

  const from = products.length === 0 ? 0 : (page - 1) * CATALOG_PAGE_SIZE + 1;
  const to =
    products.length === 0
      ? 0
      : (page - 1) * CATALOG_PAGE_SIZE + products.length;

  const cleared: CatalogSearch = {
    category: undefined,
    statuses: [...DEFAULT_CATALOG_STATUSES],
    view: undefined,
    sort: "popularity",
    minPrice: null,
    maxPrice: null,
    page: 1,
    q: "",
  };

  const filterControls = {
    priceRange: sliderRange,
    onPriceRangeChange: commitPrice,
    availability: search.statuses,
    onAvailabilityToggle: toggleAvailability,
    categoryTree,
    activeCategory: search.category,
    onCategorySelect: selectCategory,
    onReset: () => go(cleared),
    availabilityCounts,
    resultCount: total,
    canReset: !unfiltered,
  };

  // Breadcrumbs data
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...(search.category
      ? [
          { label: "Products", href: "/products" },
          ...trail.map((item, idx) => ({
            label: item.label,
            href: idx === trail.length - 1 ? undefined : `/products?category=${item.slug}`,
          })),
        ]
      : [{ label: "All Products" }]),
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-0 lg:flex-row lg:items-start lg:gap-5 xl:gap-6">
      {/* Filter Sidebar */}
      <ProductsFilters {...filterControls} />
      <ProductsMobileFilters
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        {...filterControls}
      />

      <section
        aria-busy={pending}
        className="min-w-0 w-full flex-1 scroll-mt-[7.25rem] sm:scroll-mt-[8.75rem] lg:scroll-mt-[10rem]"
      >
        <div className="sr-only" aria-live="polite">
          {pending ? "Loading products…" : `${total} products found`}
        </div>

        {/* Breadcrumb Trail */}
        <div className="mb-2 sm:mb-2.5">
          <ProductBreadcrumbs items={breadcrumbItems} />
        </div>

        {/* Toolbar */}
        <ProductsToolbar
          title={title}
          totalLabel={
            total === 0
              ? "0 products"
              : `Showing ${from}–${to} of ${total.toLocaleString("en-US")} products`
          }
          sort={search.sort}
          onSortChange={(sort) => patch({ sort })}
          categoryTree={categoryTree}
          activeCategory={search.category}
          onCategorySelect={selectCategory}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          filtersOpen={mobileFiltersOpen}
          activeFilterCount={activeFilterCount}
        />

        {/* Active Filters Pill Bar */}
        {showActiveFilters ? (
          <div
            className="mb-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2"
            aria-label="Active filters"
          >
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 mr-1 dark:text-neutral-400">
              <MaterialIcon name="filter_alt" className="text-[15px] text-primary" />
              Active:
            </span>

            {search.q ? (
              <button
                type="button"
                onClick={() => patch({ q: "" })}
                aria-label="Remove search filter"
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-200"
              >
                <span>Search: &ldquo;{search.q}&rdquo;</span>
                <MaterialIcon name="close" className="text-[13px] text-neutral-400 hover:text-neutral-700" />
              </button>
            ) : null}

            {viewChip ? (
              <button
                type="button"
                onClick={() => patch({ view: undefined, sort: "popularity" })}
                aria-label={`Remove ${viewChip} filter`}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-200"
              >
                <span>{viewChip}</span>
                <MaterialIcon name="close" className="text-[13px] text-neutral-400 hover:text-neutral-700" />
              </button>
            ) : null}

            {categoryChip ? (
              <button
                type="button"
                onClick={() => patch({ category: undefined })}
                aria-label={`Remove category filter ${categoryChip}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-primary/15"
              >
                <span>{categoryChip}</span>
                <MaterialIcon name="close" className="text-[13px]" />
              </button>
            ) : null}

            {comingSoonOn ? (
              <button
                type="button"
                onClick={() => toggleAvailability("coming-soon")}
                aria-label="Remove coming soon filter"
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-200"
              >
                <span>Coming Soon</span>
                <MaterialIcon name="close" className="text-[13px] text-neutral-400 hover:text-neutral-700" />
              </button>
            ) : null}

            {priceDirty ? (
              <button
                type="button"
                onClick={() => patch({ minPrice: null, maxPrice: null })}
                aria-label="Remove price filter"
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-200"
              >
                <span>
                  {formatTaka(sliderRange[0])}–
                  {search.maxPrice == null
                    ? `${formatTaka(PRICE_FILTER_MAX)}+`
                    : formatTaka(sliderRange[1])}
                </span>
                <MaterialIcon name="close" className="text-[13px] text-neutral-400 hover:text-neutral-700" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => go(cleared)}
              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <MaterialIcon name="delete_sweep" className="text-[14px]" />
              <span>Clear all</span>
            </button>
          </div>
        ) : null}

        {/* Content State: Products or Empty */}
        <div className={cn("transition-opacity duration-200", pending && "opacity-60 pointer-events-none")}>
          {products.length > 0 ? (
            <>
              <ProductsGrid products={products} />

              {/* Modern Pagination */}
              {pages > 1 ? (
                <nav
                  aria-label="Pagination"
                  className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8"
                >
                  {page > 1 ? (
                    <Link
                      href={catalogHref({ ...search, page: page - 1 })}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white px-4 text-xs font-bold text-neutral-900 shadow-2xs transition-all hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#121a19] dark:text-white"
                    >
                      <MaterialIcon name="chevron_left" className="text-[16px]" />
                      <span>Previous</span>
                    </Link>
                  ) : (
                    <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200/50 bg-neutral-100/60 px-4 text-xs font-medium text-neutral-400 dark:border-white/5 dark:bg-white/5 dark:text-neutral-500">
                      <MaterialIcon name="chevron_left" className="text-[16px]" />
                      <span>Previous</span>
                    </span>
                  )}

                  <div className="inline-flex h-10 items-center rounded-xl border border-neutral-200/90 bg-white px-3.5 text-xs font-bold text-neutral-700 shadow-2xs dark:border-white/10 dark:bg-[#121a19] dark:text-neutral-200">
                    Page {page} of {pages}
                  </div>

                  {page < pages ? (
                    <Link
                      href={catalogHref({ ...search, page: page + 1 })}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white px-4 text-xs font-bold text-neutral-900 shadow-2xs transition-all hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#121a19] dark:text-white"
                    >
                      <span>Next</span>
                      <MaterialIcon name="chevron_right" className="text-[16px]" />
                    </Link>
                  ) : (
                    <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200/50 bg-neutral-100/60 px-4 text-xs font-medium text-neutral-400 dark:border-white/5 dark:bg-white/5 dark:text-neutral-500">
                      <span>Next</span>
                      <MaterialIcon name="chevron_right" className="text-[16px]" />
                    </span>
                  )}
                </nav>
              ) : null}
            </>
          ) : unfiltered ? (
            <div className="rounded-2xl border border-neutral-200/90 bg-white px-6 py-14 text-center shadow-xs dark:border-white/10 dark:bg-[#121a19]">
              <div className="mx-auto mb-3.5 flex size-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-white/5">
                <MaterialIcon name="inventory_2" className="text-3xl" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                No Products Available
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                New products are being added soon. Check back later or return to the store homepage.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary-ink px-5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95"
              >
                Go to Homepage
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200/90 bg-white px-6 py-14 text-center shadow-xs dark:border-white/10 dark:bg-[#121a19]">
              <div className="mx-auto mb-3.5 flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/30">
                <MaterialIcon name="search_off" className="text-3xl" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                No Matching Products Found
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {search.q
                  ? `No products matched "${search.q}". Try adjusting your search query or removing some filters.`
                  : "We couldn't find any products matching your current filter selections."}
              </p>
              <button
                type="button"
                onClick={() => go(cleared)}
                className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary-ink px-5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95"
              >
                <MaterialIcon name="refresh" className="text-[15px]" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
