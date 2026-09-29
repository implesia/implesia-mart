"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  categoryLabels,
  type ProductCategoryId,
} from "@/app/(client)/_data/products/products";
import {
  formatTaka,
  listAdminProducts,
  MOCK_EVENT,
  STOCK_STATUS_LABEL,
  type AdminProduct,
  type StockStatus,
} from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { AdminLoading, StockStatusBadge } from "../_components/admin-ui";

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
        categoryLabels[product.categoryId],
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [inCategory, query, status]);

  if (!products) return <AdminLoading />;

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/90">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">
            {query.trim()
              ? `${visible.length}টি মিলেছে`
              : `${visible.length}টি প্রোডাক্ট`}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            সারি খুললে মূল্য, স্টক আর প্রকাশ এডিট হয়।
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
              placeholder="নাম বা ক্যাটাগরি"
              aria-label="প্রোডাক্ট খুঁজুন"
              className="h-10 w-full rounded-xl border border-neutral-200 bg-[#f5f6f8] pr-3 pl-10 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-3 focus:ring-primary/25"
            />
          </label>
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-4 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            <MaterialIcon name="add" className="text-[18px]" />
            নতুন প্রোডাক্ট
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-neutral-100 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          <FilterTab
            href={catalogHref(null, status)}
            label="সব"
            count={categoryCounts.all}
            active={category == null}
          />
          {CATEGORIES.map((id) => (
            <FilterTab
              key={id}
              href={catalogHref(id, status)}
              label={categoryLabels[id]}
              count={categoryCounts[id]}
              active={category === id}
            />
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 pb-2 sm:px-3 sm:pb-0">
          <StockChip
            href={catalogHref(category, null)}
            label="সব অবস্থা"
            active={status == null}
          />
          {STOCK_FILTERS.map((id) => (
            <StockChip
              key={id}
              href={catalogHref(category, id)}
              label={`${STOCK_STATUS_LABEL[id]} ${stockCounts[id]}`}
              active={status === id}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-neutral-500">
          {query.trim()
            ? "এই খোঁজে কোনো প্রোডাক্ট নেই।"
            : "এই ফিল্টারে কোনো প্রোডাক্ট নেই।"}
        </p>
      ) : (
        <>
          <ul className="flex flex-col lg:hidden">
            {visible.map((product) => (
              <li
                key={product.slug}
                className="border-b border-neutral-100 last:border-b-0"
              >
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-16 z-10 bg-[#f7f8fa] text-xs text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">প্রোডাক্ট</th>
                  <th className="px-5 py-3 font-medium">ক্যাটাগরি</th>
                  <th className="px-5 py-3 text-right font-medium">মূল্য</th>
                  <th className="px-5 py-3 font-medium">পরিমাণ</th>
                  <th className="px-5 py-3 font-medium">প্রকাশ</th>
                  <th className="px-5 py-3 font-medium">অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <ProductRow key={product.slug} product={product} />
                ))}
              </tbody>
            </table>
          </div>
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

function ProductCard({ product }: { product: AdminProduct }) {
  return (
    <Link
      href={`/admin/products/${product.slug}`}
      className="flex items-start gap-3 px-4 py-3.5"
    >
      <ProductThumb product={product} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-neutral-950">
              {product.title}
            </span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500">
              {product.subtitle}
            </span>
          </span>
          <StockStatusBadge status={product.status} />
        </span>
        <span className="mt-2 flex items-end justify-between gap-3">
          <span className="text-xs text-neutral-500">
            {categoryLabels[product.categoryId]}
            {" · "}
            {quantityLabel(product)}
          </span>
          <PriceStack product={product} align="end" />
        </span>
      </span>
    </Link>
  );
}

function ProductRow({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const href = `/admin/products/${product.slug}`;
  return (
    <tr
      className="cursor-pointer border-t border-neutral-100 transition-colors hover:bg-neutral-50"
      onClick={() => router.push(href)}
    >
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-3">
          <ProductThumb product={product} />
          <span className="min-w-0">
            <Link
              href={href}
              className="block truncate font-semibold text-neutral-950"
              onClick={(event) => event.stopPropagation()}
            >
              {product.title}
            </Link>
            <span className="block max-w-md truncate text-xs text-neutral-500">
              {product.subtitle}
            </span>
            {product.featured ? (
              <span className="mt-1 inline-flex text-[11px] font-medium text-primary">
                ফিচার্ড
              </span>
            ) : null}
          </span>
        </span>
      </td>
      <td className="px-5 py-3.5 text-neutral-700">
        {categoryLabels[product.categoryId]}
      </td>
      <td className="px-5 py-3.5 text-right">
        <PriceStack product={product} align="end" />
      </td>
      <td className="px-5 py-3.5 text-neutral-700">{quantityLabel(product)}</td>
      <td className="px-5 py-3.5">
        <span
          className={cn(
            "text-sm",
            product.published ? "text-neutral-800" : "text-neutral-400",
          )}
        >
          {product.published ? "লাইভ" : "লুকানো"}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <StockStatusBadge status={product.status} />
      </td>
    </tr>
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
  return product.quantity == null
    ? "অর্ডার অনুযায়ী"
    : String(product.quantity);
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProductsView />
    </Suspense>
  );
}
