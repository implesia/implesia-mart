"use client";

import { useMemo, useRef, useState } from "react";

import { SITE_NAME } from "@/lib/seo";
import { getPageRangeMeta } from "@/lib/pagination";

import { MaterialIcon } from "../../_components/common/material-icon";
import {
  categoryLabels,
  FEATURED_PRODUCT_SLUGS,
  LATEST_PRODUCT_SLUGS,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  productFilters,
  type CatalogView,
  type Product,
  type ProductBadge,
  type ProductCategoryId,
  type ProductSortId,
  type ProductStatus,
} from "../../_data/products/products";
import { ProductsFilters, ProductsMobileFilters } from "./products-filters";
import { ProductsGrid } from "./products-grid";
import { ProductsToolbar } from "./products-toolbar";

type SortId = ProductSortId;
type AvailabilityId = ProductStatus;

const DEFAULT_AVAILABILITY: AvailabilityId[] = ["available"];

function formatTaka(value: number) {
  return `৳${value.toLocaleString("en-US")}`;
}

function sortProducts(list: Product[], sort: SortId): Product[] {
  const next = [...list];

  switch (sort) {
    case "price-asc":
      return next.sort((a, b) => a.price - b.price);
    case "price-desc":
      return next.sort((a, b) => b.price - a.price);
    case "newest":
      return next.reverse();
    case "popularity":
    default:
      return next.sort((a, b) => {
        const rank = (p: Product) => {
          if (p.badge === "Best Seller") return 0;
          if (p.badge === "New") return 1;
          if (p.status === "available") return 2;
          return 3;
        };
        return rank(a) - rank(b);
      });
  }
}

type ProductsCatalogProps = {
  products: Product[];
  initialCategory?: ProductCategoryId;
  initialSort?: SortId;
  initialBadge?: ProductBadge;
  initialView?: CatalogView;
  initialCollectionTitle?: string;
};

function syncDocumentTitle(title: string) {
  document.title = `${title} | ${SITE_NAME}`;
}

function replaceCatalogSearch(mutate: (params: URLSearchParams) => void) {
  const url = new URL(window.location.href);
  mutate(url.searchParams);
  const search = url.searchParams.toString();
  window.history.replaceState(
    null,
    "",
    search ? `${url.pathname}?${search}` : url.pathname,
  );
}

const VIEW_LABEL: Record<CatalogView, string> = {
  featured: "ফিচার্ড প্রোডাক্ট",
  latest: "সর্বশেষ প্রোডাক্ট",
  new: "নতুন আগমন",
};

export function ProductsCatalog({
  products,
  initialCategory,
  initialSort = "popularity",
  initialBadge,
  initialView,
  initialCollectionTitle,
}: ProductsCatalogProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    PRICE_FILTER_MIN,
    PRICE_FILTER_MAX,
  ]);
  const [availability, setAvailability] =
    useState<AvailabilityId[]>(DEFAULT_AVAILABILITY);
  const allCategoryIds = productFilters.categories.map(
    (c) => c.id,
  ) as ProductCategoryId[];
  const [categories, setCategories] = useState<ProductCategoryId[]>(
    initialCategory ? [initialCategory] : allCategoryIds,
  );
  const [sort, setSort] = useState<SortId>(initialSort);
  const [badge, setBadge] = useState<ProductBadge | null>(initialBadge ?? null);
  const [activeView, setActiveView] = useState<CatalogView | null>(
    initialView ?? null,
  );
  const [collectionTitle, setCollectionTitle] = useState(
    initialCollectionTitle ?? null,
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const catalogTopRef = useRef<HTMLElement | null>(null);

  const filteredProducts = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;
    const viewSlugs =
      activeView === "featured"
        ? FEATURED_PRODUCT_SLUGS
        : activeView === "latest"
          ? LATEST_PRODUCT_SLUGS
          : null;

    const matched = products.filter((product) => {
      const matchesAvailability =
        availability.length === 0
          ? false
          : availability.includes(product.status);

      const matchesCategory =
        categories.length === 0
          ? false
          : categories.includes(product.categoryId);

      const matchesBadge = badge ? product.badge === badge : true;
      const matchesView = viewSlugs
        ? (viewSlugs as readonly string[]).includes(product.slug)
        : true;

      const matchesMin = product.price >= minPrice;
      const matchesMax =
        maxPrice >= PRICE_FILTER_MAX ? true : product.price <= maxPrice;

      return (
        matchesAvailability &&
        matchesCategory &&
        matchesBadge &&
        matchesView &&
        matchesMin &&
        matchesMax
      );
    });

    return sortProducts(matched, sort);
  }, [activeView, availability, badge, categories, priceRange, products, sort]);

  const range = getPageRangeMeta(
    filteredProducts.length,
    1,
    Math.max(filteredProducts.length, 1),
  );

  const toggleAvailability = (id: AvailabilityId) => {
    setAvailability((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const syncCategoryQuery = (id?: ProductCategoryId) => {
    replaceCatalogSearch((params) => {
      if (id) params.set("category", id);
      else params.delete("category");
    });
  };

  const clearViewQuery = () => {
    replaceCatalogSearch((params) => {
      params.delete("view");
    });
  };

  const titleForCategories = (next: ProductCategoryId[]) =>
    next.length === 1
      ? categoryLabels[next[0]]
      : (collectionTitle ?? "সব প্রোডাক্ট");

  const selectCategoryChip = (id: ProductCategoryId | "all") => {
    const next = id === "all" ? allCategoryIds : [id];
    setCategories(next);
    setActiveView(null);
    setBadge(null);
    setCollectionTitle(null);
    syncCategoryQuery(id === "all" ? undefined : id);
    clearViewQuery();
    syncDocumentTitle(titleForCategories(next));
  };

  const handlePriceRangeChange = (next: [number, number]) => {
    setPriceRange(next);
  };

  const handleSortChange = (next: SortId) => {
    setSort(next);
  };

  const resetFilters = () => {
    setPriceRange([PRICE_FILTER_MIN, PRICE_FILTER_MAX]);
    setAvailability(DEFAULT_AVAILABILITY);
    setCategories(allCategoryIds);
    setSort("popularity");
    setBadge(null);
    setActiveView(null);
    setCollectionTitle(null);
    replaceCatalogSearch((params) => {
      params.delete("category");
      params.delete("view");
    });
    syncDocumentTitle("সব প্রোডাক্ট");
  };

  const clearView = () => {
    setActiveView(null);
    setBadge(null);
    setCollectionTitle(null);
    clearViewQuery();
    syncDocumentTitle(
      categories.length === 1 ? categoryLabels[categories[0]] : "সব প্রোডাক্ট",
    );
  };

  const filterControls = {
    priceRange,
    onPriceRangeChange: handlePriceRangeChange,
    availability,
    onAvailabilityToggle: toggleAvailability,
    categories,
    onCategorySelect: selectCategoryChip,
    onReset: resetFilters,
  };

  const totalLabel =
    filteredProducts.length === 0
      ? "কোনো পণ্য পাওয়া যায়নি"
      : `${range.total}টি প্রোডাক্ট`;

  const pageTitle =
    categories.length === 1
      ? categoryLabels[categories[0]]
      : (collectionTitle ?? "সব প্রোডাক্ট");

  const priceDirty =
    priceRange[0] > PRICE_FILTER_MIN || priceRange[1] < PRICE_FILTER_MAX;
  const comingSoonOn = availability.includes("coming-soon");
  const categoryChip =
    categories.length === 1 ? categoryLabels[categories[0]] : null;
  const viewChip = activeView ? VIEW_LABEL[activeView] : null;
  const showActiveFilters = Boolean(
    viewChip || categoryChip || comingSoonOn || priceDirty,
  );

  return (
    <div className="flex w-full flex-col gap-0 lg:flex-row lg:items-start lg:gap-5 xl:gap-6">
      <ProductsFilters {...filterControls} />
      <ProductsMobileFilters
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        {...filterControls}
      />

      <section
        ref={catalogTopRef}
        className="min-w-0 w-full flex-1 scroll-mt-[7.25rem] sm:scroll-mt-[8.75rem] lg:scroll-mt-[10rem]"
      >
        <ProductsToolbar
          title={pageTitle}
          totalLabel={totalLabel}
          sort={sort}
          onSortChange={handleSortChange}
          categories={categories}
          onCategorySelect={selectCategoryChip}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        />

        {showActiveFilters ? (
          <ul className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-3.5">
            {viewChip ? (
              <li>
                <button
                  type="button"
                  onClick={clearView}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-medium text-white"
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
                  onClick={() => selectCategoryChip("all")}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
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
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800"
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
                  onClick={() =>
                    setPriceRange([PRICE_FILTER_MIN, PRICE_FILTER_MAX])
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800"
                >
                  {formatTaka(priceRange[0])}–{formatTaka(priceRange[1])}
                  <MaterialIcon name="close" className="text-[14px]" />
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}

        {filteredProducts.length > 0 ? (
          <ProductsGrid products={filteredProducts} />
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low px-4 py-8 text-center dark:border-white/10 sm:px-6 sm:py-10">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-14">
              <MaterialIcon
                name="search_off"
                className="text-[24px] sm:text-[28px]"
              />
            </div>
            <p className="text-base font-semibold text-on-background sm:text-lg">
              কোনো পণ্য পাওয়া যায়নি
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              ফিল্টার রিসেট করুন
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
