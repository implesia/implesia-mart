"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  CATALOG_PAGE_SIZE,
  catalogHref,
  DEFAULT_CATALOG_STATUSES,
  isUnfilteredCatalog,
  type CatalogSearch,
} from "@/lib/mart-api/catalog-query";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  categoryLabels,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  type CatalogView,
  type Product,
  type ProductCategoryId,
  type ProductStatus,
} from "../../_data/products/catalog-meta";
import { ProductsFilters, ProductsMobileFilters } from "./products-filters";
import { ProductsGrid } from "./products-grid";
import { ProductsToolbar } from "./products-toolbar";

const VIEW_LABEL: Record<CatalogView, string> = {
  featured: "Featured Products",
  latest: "সর্বশেষ প্রোডাক্ট",
  new: "নতুন আগমন",
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
  categoryCounts: Record<ProductCategoryId, number>;
  availabilityCounts: Record<ProductStatus, number>;
  searchTruncated: boolean;
};

export function ProductsCatalog({
  search,
  title,
  products,
  total,
  page,
  pages,
  categoryCounts,
  availabilityCounts,
  searchTruncated,
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
  const categoryChip = search.category ? categoryLabels[search.category] : null;
  const viewChip = search.view ? VIEW_LABEL[search.view] : null;
  const showActiveFilters = Boolean(
    search.q || viewChip || categoryChip || comingSoonOn || priceDirty,
  );
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
    categories: search.category
      ? [search.category]
      : (["gadgets", "fashion"] as ProductCategoryId[]),
    onCategorySelect: selectCategory,
    onReset: () => go(cleared),
    categoryCounts,
    availabilityCounts,
    resultCount: total,
    canReset: !unfiltered,
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-0 lg:flex-row lg:items-start lg:gap-3.5 xl:gap-4">
      {/* h1 before the filter sidebar's h2; the toolbar shows the same title visually. */}
      <h1 className="sr-only">{title}</h1>
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
          {pending ? "পণ্য লোড হচ্ছে" : `${total}টি প্রোডাক্ট`}
        </div>
        <ProductsToolbar
          title={title}
          totalLabel={
            total === 0
              ? "০টি প্রোডাক্ট"
              : `${from}–${to} / ${total.toLocaleString("en-US")}টি প্রোডাক্ট`
          }
          sort={search.sort}
          onSortChange={(sort) => patch({ sort })}
          categories={filterControls.categories}
          onCategorySelect={selectCategory}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          filtersOpen={mobileFiltersOpen}
        />

        {searchTruncated ? (
          <p className="mb-2 text-xs leading-relaxed text-on-surface-variant">
            আরও মিল থাকতে পারে। ক্যাটাগরি দিয়ে সীমিত করে দেখুন।
          </p>
        ) : null}

        {showActiveFilters ? (
          <ul
            className="mb-3 flex flex-wrap items-center gap-1.5"
            aria-label="সক্রিয় ফিল্টার"
          >
            {search.q ? (
              <li>
                <button
                  type="button"
                  onClick={() => patch({ q: "" })}
                  aria-label="খোঁজ সরান"
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-neutral-950 px-3 text-xs font-medium text-white"
                >
                  খোঁজ: {search.q}
                  <MaterialIcon name="close" className="text-[14px]" />
                </button>
              </li>
            ) : null}
            {viewChip ? (
              <li>
                <button
                  type="button"
                  onClick={() => patch({ view: undefined, sort: "popularity" })}
                  aria-label={`${viewChip} সরান`}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-neutral-950 px-3 text-xs font-medium text-white"
                >
                  {viewChip}
                  <MaterialIcon name="close" className="text-[14px]" />
                </button>
              </li>
            ) : null}
            {categoryChip ? (
              <li>
                <button
                  type="button"
                  onClick={() => patch({ category: undefined })}
                  aria-label={`${categoryChip} সরান`}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-primary-container px-3 text-xs font-medium text-primary-ink"
                >
                  {categoryChip}
                  <MaterialIcon name="close" className="text-[14px]" />
                </button>
              </li>
            ) : null}
            {comingSoonOn ? (
              <li>
                <button
                  type="button"
                  onClick={() => toggleAvailability("coming-soon")}
                  aria-label="শীঘ্রই আসছে সরান"
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-neutral-100 px-3 text-xs font-medium text-neutral-800"
                >
                  শীঘ্রই আসছে
                  <MaterialIcon name="close" className="text-[14px]" />
                </button>
              </li>
            ) : null}
            {priceDirty ? (
              <li>
                <button
                  type="button"
                  onClick={() => patch({ minPrice: null, maxPrice: null })}
                  aria-label="দামের ফিল্টার সরান"
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-neutral-100 px-3 text-xs font-medium text-neutral-800"
                >
                  {formatTaka(sliderRange[0])}–
                  {search.maxPrice == null
                    ? `${formatTaka(PRICE_FILTER_MAX)}+`
                    : formatTaka(sliderRange[1])}
                  <MaterialIcon name="close" className="text-[14px]" />
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}

        {products.length > 0 ? (
          <>
            <ProductsGrid products={products} />
            {pages > 1 ? (
              <nav
                aria-label="পৃষ্ঠা"
                className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-5"
              >
                {page > 1 ? (
                  <Link
                    href={catalogHref({ ...search, page: page - 1 })}
                    className="inline-flex h-11 items-center rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-950"
                  >
                    আগের পাতা
                  </Link>
                ) : (
                  <span className="inline-flex h-11 items-center rounded-full border border-neutral-200 px-4 text-sm font-semibold text-neutral-400">
                    আগের পাতা
                  </span>
                )}
                <p className="px-2 text-sm font-medium text-on-surface-variant">
                  পৃষ্ঠা {page} / {pages}
                </p>
                {page < pages ? (
                  <Link
                    href={catalogHref({ ...search, page: page + 1 })}
                    className="inline-flex h-11 items-center rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-950"
                  >
                    পরের পাতা
                  </Link>
                ) : (
                  <span className="inline-flex h-11 items-center rounded-full border border-neutral-200 px-4 text-sm font-semibold text-neutral-400">
                    পরের পাতা
                  </span>
                )}
              </nav>
            ) : null}
          </>
        ) : unfiltered ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-white px-4 py-10 text-center sm:px-6">
            <h2 className="text-base font-semibold text-on-surface sm:text-lg">
              এখন কোনো প্রোডাক্ট নেই
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
              নতুন প্রোডাক্ট প্রকাশিত হলে এখানে দেখা যাবে।
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold"
            >
              হোমে যান
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-white px-4 py-10 text-center sm:px-6">
            <h2 className="text-base font-semibold text-on-surface sm:text-lg">
              কোনো পণ্য পাওয়া যায়নি
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
              {search.q
                ? `“${search.q}” এর সাথে কোনো পণ্য মেলেনি।`
                : "নির্বাচিত ফিল্টারে কোনো পণ্য নেই।"}
            </p>
            <button
              type="button"
              onClick={() => go(cleared)}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold"
            >
              সব প্রোডাক্ট দেখুন
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
