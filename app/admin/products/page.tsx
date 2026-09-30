"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import type { ProductCategoryId } from "@/app/(client)/_data/products/products";
import {
  formatTaka,
  listAdminProducts,
  MOCK_EVENT,
  saveAdminProduct,
  type AdminProduct,
  type StockStatus,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import {
  ADMIN_CATEGORY_LABEL,
  ADMIN_STOCK_STATUS_LABEL,
  AdminLoading,
  STOCK_STATUS_TONE,
} from "../_components/admin-ui";

const PAGE_SIZE = 10;

const CATEGORIES: ProductCategoryId[] = ["gadgets", "fashion"];
const STOCK_FILTERS: StockStatus[] = ["available", "sold-out", "coming-soon"];

function isCategory(value: string | null): value is ProductCategoryId {
  return value === "gadgets" || value === "fashion";
}

function isStock(value: string | null): value is StockStatus {
  return (
    value === "available" || value === "sold-out" || value === "coming-soon"
  );
}

function catalogHref(
  category: ProductCategoryId | null,
  status: StockStatus | null,
) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  const query = params.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

function ProductsView() {
  const params = useSearchParams();
  const categoryParam = params.get("category");
  const statusParam = params.get("status");
  const category = isCategory(categoryParam) ? categoryParam : null;
  const status = isStock(statusParam) ? statusParam : null;
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [query, setQuery] = useState("");
  const [pageState, setPageState] = useState({ key: "", page: 0 });

  useEffect(() => {
    const sync = () => setProducts(listAdminProducts());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(MOCK_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(MOCK_EVENT, sync);
    };
  }, []);

  const inCategory = useMemo(() => {
    if (!products) return [];
    return category
      ? products.filter((product) => product.categoryId === category)
      : products;
  }, [category, products]);

  const categoryCounts = useMemo(() => {
    if (!products) return { all: 0, gadgets: 0, fashion: 0 };
    const pool = status
      ? products.filter((product) => product.status === status)
      : products;
    return {
      all: pool.length,
      gadgets: pool.filter((product) => product.categoryId === "gadgets")
        .length,
      fashion: pool.filter((product) => product.categoryId === "fashion")
        .length,
    };
  }, [products, status]);

  const stockCounts = useMemo(() => {
    const next = { available: 0, "sold-out": 0, "coming-soon": 0 } as Record<
      StockStatus,
      number
    >;
    for (const product of inCategory) next[product.status] += 1;
    return next;
  }, [inCategory]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inCategory.filter((product) => {
      if (status && product.status !== status) return false;
      if (!needle) return true;
      return [
        product.title,
        product.subtitle,
        ADMIN_CATEGORY_LABEL[product.categoryId],
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [inCategory, query, status]);

  const filterKey = `${category ?? ""}|${status ?? ""}|${query}`;
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const storedPage = pageState.key === filterKey ? pageState.page : 0;
  const page = Math.min(storedPage, pageCount - 1);
  const pageRows = visible.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  function goToPage(next: number) {
    setPageState({ key: filterKey, page: next });
  }

  if (!products) return <AdminLoading />;

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">
            {query.trim()
              ? `${visible.length} matching`
              : `${visible.length} ${visible.length === 1 ? "product" : "products"}`}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Change stock or publishing here. Open a row for the full edit.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <label className="relative block w-full sm:w-80">
            <MaterialIcon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or category"
              aria-label="Search products"
              className="h-10 w-full rounded-xl border border-neutral-200 bg-[#f5f6f8] pr-3 pl-10 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
            />
          </label>
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-4 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            <MaterialIcon name="add" className="text-[18px]" />
            New product
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-neutral-100 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          <FilterTab
            href={catalogHref(null, status)}
            label="All"
            count={categoryCounts.all}
            active={category == null}
          />
          {CATEGORIES.map((id) => (
            <FilterTab
              key={id}
              href={catalogHref(id, status)}
              label={ADMIN_CATEGORY_LABEL[id]}
              count={categoryCounts[id]}
              active={category === id}
            />
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 pb-2 sm:px-3 sm:pb-0">
          <StockChip
            href={catalogHref(category, null)}
            label="All statuses"
            active={status == null}
          />
          {STOCK_FILTERS.map((id) => (
            <StockChip
              key={id}
              href={catalogHref(category, id)}
              label={`${ADMIN_STOCK_STATUS_LABEL[id]} ${stockCounts[id]}`}
              active={status === id}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-neutral-500">
          {query.trim()
            ? "No products match this search."
            : "No products in this filter."}
        </p>
      ) : (
        <>
          <ul className="flex flex-col lg:hidden">
            {pageRows.map((product, index) => (
              <li
                key={product.slug}
                className="border-b border-neutral-100 last:border-b-0"
              >
                <ProductCard
                  product={product}
                  index={page * PAGE_SIZE + index + 1}
                />
              </li>
            ))}
          </ul>
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-16 z-10 bg-[#f7f8fa] text-xs text-neutral-500">
                <tr>
                  <th className="w-12 px-4 py-3 text-right font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Published</th>
                  <th className="px-4 py-3 font-medium">Status</th>
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
            onPage={goToPage}
          />
        </>
      )}
    </section>
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
        "relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium",
        active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-800",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
          active
            ? "bg-primary/10 text-primary"
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

function StockChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
        active
          ? "bg-neutral-950 text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
      )}
    >
      {label}
    </Link>
  );
}

function ProductCard({
  product,
  index,
}: {
  product: AdminProduct;
  index: number;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <span className="w-5 shrink-0 pt-1 text-right text-xs tabular-nums text-neutral-400">
        {index}
      </span>
      <Link
        href={`/admin/products/${product.slug}`}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <ProductThumb product={product} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-neutral-950">
            {product.title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-neutral-500">
            {product.subtitle}
          </span>
          <span className="mt-2 flex items-end justify-between gap-3">
            <span className="text-xs text-neutral-500">
              {ADMIN_CATEGORY_LABEL[product.categoryId]}
              {" · "}
              {quantityLabel(product)}
            </span>
            <PriceStack product={product} align="end" />
          </span>
        </span>
      </Link>
      <span className="flex shrink-0 flex-col items-end gap-2">
        <StockSelect product={product} />
        <PublishSwitch product={product} />
      </span>
    </div>
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
  return (
    <tr
      className="cursor-pointer border-t border-neutral-100 transition-colors hover:bg-neutral-50"
      onClick={() => router.push(href)}
    >
      <td className="px-4 py-3 text-right text-xs tabular-nums text-neutral-400">
        {index}
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-3">
          <ProductThumb product={product} />
          <span className="min-w-0">
            <Link
              href={href}
              className="block truncate font-semibold text-neutral-950 hover:text-primary"
              onClick={(event) => event.stopPropagation()}
            >
              {product.title}
            </Link>
            <span className="block max-w-md truncate text-xs text-neutral-500">
              {product.subtitle}
            </span>
            {product.featured ? (
              <span className="mt-1 inline-flex text-[11px] font-medium text-primary">
                Featured
              </span>
            ) : null}
          </span>
        </span>
      </td>
      <td className="px-4 py-3 text-neutral-700">
        {ADMIN_CATEGORY_LABEL[product.categoryId]}
      </td>
      <td className="px-4 py-3 text-right">
        <PriceStack product={product} align="end" />
      </td>
      <td className="px-4 py-3 text-neutral-700">{quantityLabel(product)}</td>
      <td className="px-4 py-3">
        <PublishSwitch product={product} />
      </td>
      <td className="px-4 py-3">
        <StockSelect product={product} />
      </td>
    </tr>
  );
}

function StockSelect({ product }: { product: AdminProduct }) {
  return (
    <span
      className="relative inline-flex shrink-0"
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
          "h-8 max-w-36 cursor-pointer appearance-none rounded-full py-0 pr-6 pl-2.5 text-xs font-semibold outline-none",
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
      className="inline-flex items-center gap-2"
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
  if (total === 0) return null;
  const start = page * PAGE_SIZE + 1;
  const end = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
      <p className="text-xs text-neutral-500">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="grid size-8 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:text-neutral-300"
        >
          <MaterialIcon name="chevron_left" className="text-[20px]" />
        </button>
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Page ${index + 1}`}
            aria-current={index === page ? "page" : undefined}
            onClick={() => onPage(index)}
            className={cn(
              "grid size-8 place-items-center rounded-full text-sm font-medium",
              index === page
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {index + 1}
          </button>
        ))}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount - 1}
          onClick={() => onPage(page + 1)}
          className="grid size-8 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:text-neutral-300"
        >
          <MaterialIcon name="chevron_right" className="text-[20px]" />
        </button>
      </div>
    </div>
  );
}

function ProductThumb({ product }: { product: AdminProduct }) {
  return (
    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
      <Image
        src={product.imageSrc}
        alt=""
        fill
        sizes="48px"
        className="object-cover"
      />
    </span>
  );
}

function PriceStack({
  product,
  align,
}: {
  product: AdminProduct;
  align: "start" | "end";
}) {
  const compare =
    product.compareAtPrice != null && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : null;
  return (
    <span className={cn("block", align === "end" && "text-right")}>
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

function quantityLabel(product: AdminProduct) {
  return product.quantity == null ? "Made to order" : String(product.quantity);
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProductsView />
    </Suspense>
  );
}
