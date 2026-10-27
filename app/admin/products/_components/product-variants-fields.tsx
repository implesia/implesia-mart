"use client";

import { useState } from "react";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import {
  addMissingRows,
  combinations,
  rollup,
  usableGroups,
  variantLabel,
  type VariantCheck,
  type VariantRow,
} from "@/lib/mart-api/admin-variants";
import type { ProductOptionGroup } from "@/lib/mart-mock/product-content";
import { cn } from "@/lib/utils";

import { adminFieldClass, FieldLabel } from "../../_components/admin-ui";

const invalidClass =
  "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200";

export function ProductVariantsFields({
  formId,
  groups,
  rows,
  basePrice,
  check,
  showErrors,
  onChange,
}: {
  formId: string;
  groups: ProductOptionGroup[];
  rows: VariantRow[];
  /** Pre-fills the price of new variants. */
  basePrice: string;
  check: VariantCheck;
  showErrors: boolean;
  onChange: (rows: VariantRow[]) => void;
}) {
  const [notice, setNotice] = useState("");
  const usable = usableGroups(groups);
  const possible = combinations(groups).length;
  const summary = rollup(rows);

  function generate() {
    const result = addMissingRows(groups, rows, { price: basePrice });
    onChange(result.rows);
    setNotice(
      result.truncated
        ? `Added ${result.added}. The limit of 100 variants was reached.`
        : result.added === 0
          ? "Every combination already has a variant."
          : `Added ${result.added} variant${result.added === 1 ? "" : "s"}. Set each price and stock below.`,
    );
  }

  function patch(key: string, next: Partial<VariantRow>) {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...next } : row)));
  }

  return (
    <div className="space-y-4" data-testid="variants-editor">
      <p className="text-sm text-neutral-600">
        Use variants when price, stock, or SKU differ by option, such as a size or weight. Each variant is one
        combination of your options. Leave this empty for a product with a single price.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={usable.length === 0 || possible === 0}
          data-testid="variants-generate"
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-semibold text-neutral-900 ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MaterialIcon name="auto_awesome" className="text-[18px]" />
          {rows.length === 0 ? "Create variants from options" : "Add missing combinations"}
        </button>
        {rows.length > 0 ? (
          <span className="text-xs text-neutral-500">
            {rows.length} of {possible} possible combination{possible === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <p role="status" className="min-h-5 text-xs text-neutral-600">
        {notice}
      </p>

      {usable.length === 0 ? (
        <p className="rounded-xl bg-[#f5f6f8] px-3 py-3 text-sm text-neutral-500">
          Add an option with at least one value above to create variants.
        </p>
      ) : null}

      {showErrors && check.form ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {check.form}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <ul className="space-y-3">
            {rows.map((row, index) => {
              const errors = showErrors ? (check.rows[row.key] ?? {}) : {};
              const label = variantLabel(groups, row.options);
              const id = `${formId}-variant-${index}`;
              return (
                <li
                  key={row.key}
                  data-testid="variant-row"
                  className={cn(
                    "rounded-2xl bg-[#f5f6f8] p-3 sm:p-4",
                    !row.isActive && "opacity-80",
                  )}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900" data-testid="variant-label">
                      {label}
                      {!row.isActive ? (
                        <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          Hidden from shoppers
                        </span>
                      ) : null}
                    </p>
                    <div className="flex items-center gap-1">
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={row.isActive}
                          onChange={(event) => patch(row.key, { isActive: event.target.checked })}
                          className="size-4"
                        />
                        Available
                      </label>
                      <button
                        type="button"
                        onClick={() => onChange(rows.filter((item) => item.key !== row.key))}
                        className="grid size-11 place-items-center rounded-xl text-neutral-500 hover:bg-white hover:text-red-500"
                        aria-label={`Remove variant ${label}`}
                      >
                        <MaterialIcon name="delete" className="text-[20px]" />
                      </button>
                    </div>
                  </div>
                  {errors.options ? (
                    <p role="alert" className="mb-3 text-xs text-red-600">
                      {errors.options}
                    </p>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field
                      id={`${id}-price`}
                      label="Price (taka)"
                      value={row.price}
                      inputMode="numeric"
                      error={errors.price}
                      onChange={(price) => patch(row.key, { price })}
                    />
                    <Field
                      id={`${id}-compare`}
                      label="Compare-at price"
                      value={row.compareAtPrice}
                      inputMode="numeric"
                      placeholder="Optional"
                      error={errors.compareAtPrice}
                      onChange={(compareAtPrice) => patch(row.key, { compareAtPrice })}
                    />
                    <Field
                      id={`${id}-stock`}
                      label="Stock"
                      value={row.quantity}
                      inputMode="numeric"
                      placeholder="Blank = made to order"
                      error={errors.quantity}
                      onChange={(quantity) => patch(row.key, { quantity })}
                    />
                    <Field
                      id={`${id}-sku`}
                      label="SKU"
                      value={row.sku}
                      placeholder="Optional"
                      error={errors.sku}
                      onChange={(sku) => patch(row.key, { sku })}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="rounded-xl bg-[#f5f6f8] px-3 py-2.5 text-xs text-neutral-600" data-testid="variants-rollup">
            Shown in the product list:{" "}
            {summary.price == null ? "no price yet" : `from ৳${summary.price.toLocaleString("en-US")}`},{" "}
            {summary.quantity == null
              ? "stock not limited"
              : `${summary.quantity} in stock${summary.soldOut ? " (sold out)" : ""}`}
            . The price and stock of the product itself come from its variants.
          </p>
        </>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  inputMode,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputMode?: "numeric";
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(adminFieldClass, error && invalidClass)}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
