"use client";

import { useMemo, useRef, useState } from "react";

import { SITE_NAME } from "@/lib/seo";
import {
  clampPage,
  DEFAULT_PAGE_SIZE,
  getPageRangeMeta,
  getTotalPages,
  paginateItems,
} from "@/lib/pagination";

import { MaterialIcon } from "../../_components/common/material-icon";
import { Pagination } from "../../_components/common/pagination";
import {
  categoryLabels,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  productFilters,
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

const PRODUCTS_PAGE_SIZE = DEFAULT_PAGE_SIZE;

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

export function ProductsCatalog({
  products,
  initialCategory,
  initialSort = "popularity",
  initialBadge,
  initialCollectionTitle,
}: ProductsCatalogProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    PRICE_FILTER_MIN,
    PRICE_FILTER_MAX,
  ]);
  const [availability, setAvailability] = useState<AvailabilityId[]>([
    "available",
    "coming-soon",
  ]);
  const allCategoryIds = productFilters.categories.map(
    (c) => c.id,
  ) as ProductCategoryId[];
  const [categories, setCategories] = useState<ProductCategoryId[]>(
    initialCategory ? [initialCategory] : allCategoryIds,
  );
  const [sort, setSort] = useState<SortId>(initialSort);
  const [badge, setBadge] = useState<ProductBadge | null>(initialBadge ?? null);
  const [collectionTitle, setCollectionTitle] = useState(
    initialCollectionTitle ?? null,
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const catalogTopRef = useRef<HTMLElement | null>(null);

  const filteredProducts = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;

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

      const matchesMin = product.price >= minPrice;
      const matchesMax =
        maxPrice >= PRICE_FILTER_MAX ? true : product.price <= maxPrice;

      return (
        matchesAvailability &&
        matchesCategory &&
        matchesBadge &&
        matchesMin &&
        matchesMax
      );
    });

    return sortProducts(matched, sort);
  }, [availability, badge, categories, priceRange, products, sort]);

  const totalPages = getTotalPages(filteredProducts.length, PRODUCTS_PAGE_SIZE);
  const safePage = clampPage(page, totalPages);

  const paginatedProducts = useMemo(
    () => paginateItems(filteredProducts, safePage, PRODUCTS_PAGE_SIZE),
    [filteredProducts, safePage],
  );

  const range = getPageRangeMeta(
    filteredProducts.length,
    safePage,
    PRODUCTS_PAGE_SIZE,
  );

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    catalogTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const toggleAvailability = (id: AvailabilityId) => {
    setAvailability((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setPage(1);
  };

  const syncCategoryQuery = (id?: ProductCategoryId) => {
    replaceCatalogSearch((params) => {
      if (id) params.set("category", id);
      else params.delete("category");
    });
  };

  const titleForCategories = (next: ProductCategoryId[]) =>
    next.length === 1
      ? categoryLabels[next[0]]
      : (collectionTitle ?? "সব প্রোডাক্ট");

  const toggleCategory = (id: ProductCategoryId) => {
    const next = categories.includes(id)
      ? categories.filter((item) => item !== id)
      : [...categories, id];
    setCategories(next);
    syncCategoryQuery(next.length === 1 ? next[0] : undefined);
    syncDocumentTitle(titleForCategories(next));
    setPage(1);
  };

  const selectCategoryChip = (id: ProductCategoryId | "all") => {
    const next = id === "all" ? allCategoryIds : [id];
    setCategories(next);
    syncCategoryQuery(id === "all" ? undefined : id);
    syncDocumentTitle(titleForCategories(next));
    setPage(1);
  };

  const handlePriceRangeChange = (next: [number, number]) => {
    setPriceRange(next);
    setPage(1);
  };

  const handleSortChange = (next: SortId) => {
    setSort(next);
    setPage(1);
  };

  const resetFilters = () => {
    setPriceRange([PRICE_FILTER_MIN, PRICE_FILTER_MAX]);
    setAvailability(["available", "coming-soon"]);
    setCategories(allCategoryIds);
    setSort("popularity");
    setBadge(null);
    setCollectionTitle(null);
    setPage(1);
    replaceCatalogSearch((params) => {
      params.delete("category");
      params.delete("view");
    });
    syncDocumentTitle("সব প্রোডাক্ট");
  };

  const filterControls = {
    priceRange,
    onPriceRangeChange: handlePriceRangeChange,
    availability,
    onAvailabilityToggle: toggleAvailability,
    categories,
    onCategoryToggle: toggleCategory,
    onReset: resetFilters,
  };

  const totalLabel =
    filteredProducts.length === 0
      ? "কোনো পণ্য পাওয়া যায়নি"
      : filteredProducts.length === products.length
        ? `${range.start}–${range.end} দেখানো হচ্ছে (মোট ${range.total}টি)`
        : `${range.start}–${range.end} দেখানো হচ্ছে (ফিল্টারড ${range.total}টি / মোট ${products.length}টি)`;

  const paginationSummary = `${range.start}–${range.end} দেখানো হচ্ছে · মোট ${range.total}টি`;

  const pageTitle =
    categories.length === 1
      ? categoryLabels[categories[0]]
      : (collectionTitle ?? "সব প্রোডাক্ট");

  return (
    <div className="flex w-full flex-col gap-0 lg:flex-row lg:items-start lg:gap-7 xl:gap-8">
      <ProductsFilters {...filterControls} />
      <ProductsMobileFilters
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        {...filterControls}
      />

      <section
        ref={catalogTopRef}
        className="min-w-0 w-full flex-1 scroll-mt-20 sm:scroll-mt-24"
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

        {filteredProducts.length > 0 ? (
          <>
            <ProductsGrid products={paginatedProducts} />
            <Pagination
              className="mt-8 sm:mt-10"
              page={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              summary={paginationSummary}
              ariaLabel="প্রোডাক্ট পেজিনেশন"
            />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low px-4 py-12 text-center dark:border-white/10 sm:px-6 sm:py-16">
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
