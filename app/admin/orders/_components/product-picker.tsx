"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { searchProductsForOrder, type OrderProductChoice } from "@/lib/mart-api/orders-desk";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka } from "@/lib/mart-mock/store";

export function ProductPicker({
  onPick,
  label = "Add a product",
}: {
  onPick: (choice: OrderProductChoice) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ term: string; items: OrderProductChoice[]; error: string | null }>({
    term: "",
    items: [],
    error: null,
  });
  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void searchProductsForOrder(term)
        .then((next) => {
          if (!cancelled) setResult({ term, items: next, error: null });
        })
        .catch((reason: unknown) => {
          if (!cancelled) {
            setResult({
              term,
              items: [],
              error: reason instanceof MartApiError ? reason.message : "Could not search products.",
            });
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [term]);

  const ready = term.length >= 2 && result.term === term;
  const items = ready ? result.items : [];
  const error = ready ? result.error : null;
  const loading = term.length >= 2 && !ready;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="order-product-search">
        {label}
      </label>
      <div className="relative">
        <MaterialIcon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-neutral-500" />
        <input
          id="order-product-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name"
          className="h-11 w-full rounded-xl border border-neutral-200 bg-[#f5f6f8] pr-3 pl-10 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30"
        />
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-2 text-sm text-neutral-500">Searching…</p> : null}
      {items.length > 0 ? (
        <ul className="mt-2 max-h-64 overflow-auto rounded-2xl bg-white ring-1 ring-neutral-200">
          {items.map((item) => {
            const key = `${item.productId}:${item.variantId ?? "product"}`;
            const stock =
              item.quantity == null ? "Made to order" : item.quantity <= 0 ? "Out of stock" : `${item.quantity} in stock`;
            return (
              <li key={key} className="border-t border-neutral-100 first:border-t-0">
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-neutral-50"
                >
                  {item.imageSrc ? (
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <Image src={item.imageSrc} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                  ) : (
                    <span className="size-10 shrink-0 rounded-lg bg-neutral-100" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-950">{item.title}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {[item.optionLabel, item.sku, stock].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{formatTaka(item.unitPrice)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
