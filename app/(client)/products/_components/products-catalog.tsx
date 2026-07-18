"use client";

import { useMemo, useState } from "react";

import {
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  productFilters,
  type Product,
  type ProductStatus,
} from "../../_data/products/products";
import { ProductsFilters } from "./products-filters";
import { ProductsGrid } from "./products-grid";
import { ProductsToolbar } from "./products-toolbar";

type SortId = (typeof productFilters.sortOptions)[number]["id"];
type AvailabilityId = ProductStatus;

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
};

export function ProductsCatalog({ products }: ProductsCatalogProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    PRICE_FILTER_MIN,
    PRICE_FILTER_MAX,
  ]);
  const [availability, setAvailability] = useState<AvailabilityId[]>([
    "available",
    "coming-soon",
  ]);
  const [sort, setSort] = useState<SortId>("popularity");

  const filteredProducts = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;

    const matched = products.filter((product) => {
      const matchesAvailability =
        availability.length === 0
          ? false
          : availability.includes(product.status);

      const matchesMin = product.price >= minPrice;
      const matchesMax =
        maxPrice >= PRICE_FILTER_MAX
          ? true
          : product.price <= maxPrice;

      return matchesAvailability && matchesMin && matchesMax;
    });

    return sortProducts(matched, sort);
  }, [availability, priceRange, products, sort]);

  const toggleAvailability = (id: AvailabilityId) => {
    setAvailability((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const resetFilters = () => {
    setPriceRange([PRICE_FILTER_MIN, PRICE_FILTER_MAX]);
    setAvailability(["available", "coming-soon"]);
    setSort("popularity");
  };

  const totalLabel =
    filteredProducts.length === products.length
      ? `সব ${filteredProducts.length}টি পণ্য দেখানো হচ্ছে`
      : `${filteredProducts.length}টি পণ্য দেখানো হচ্ছে (মোট ${products.length}টি)`;

  return (
    <div className="flex w-full gap-6 lg:gap-8">
      <ProductsFilters
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        availability={availability}
        onAvailabilityToggle={toggleAvailability}
        onReset={resetFilters}
      />

      <section className="min-w-0 flex-1">
        <ProductsToolbar
          totalLabel={totalLabel}
          sort={sort}
          onSortChange={setSort}
        />

        {filteredProducts.length > 0 ? (
          <ProductsGrid products={filteredProducts} />
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low px-6 py-16 text-center">
            <p className="text-lg font-semibold text-on-background">
              কোনো পণ্য পাওয়া যায়নি
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
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
