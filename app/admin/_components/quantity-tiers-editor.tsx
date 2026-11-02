"use client";

import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";
import { MAX_TIER_ROWS, type TierRow } from "@/lib/mart-api/pricing";
import { cn } from "@/lib/utils";

import { adminButtonClass, adminFieldClass } from "./admin-ui";

/** Quantity tiers (buy N or more -> extra %), shared by Settings and the product form. */
export function QuantityTiersEditor({
  id,
  rows,
  onChange,
  error,
}: {
  id: string;
  rows: TierRow[];
  onChange: (rows: TierRow[]) => void;
  error?: string;
}) {
  function update(index: number, patch: Partial<TierRow>) {
    onChange(rows.map((row, at) => (at === index ? { ...row, ...patch } : row)));
  }
  return (
    <div data-testid="quantity-tiers-editor">
      {rows.length ? (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-neutral-500">
            <span>Buy at least (pieces)</span>
            <span>Extra discount %</span>
            <span className="w-10" aria-hidden />
          </div>
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <input
                id={`${id}-qty-${index}`}
                inputMode="numeric"
                aria-label={`Tier ${index + 1} quantity`}
                value={row.minQuantity}
                onChange={(event) => update(index, { minQuantity: event.target.value })}
                placeholder="2"
                className={cn(adminFieldClass, error && "border-red-400")}
              />
              <input
                inputMode="decimal"
                aria-label={`Tier ${index + 1} extra percent`}
                value={row.extra}
                onChange={(event) => update(index, { extra: event.target.value })}
                placeholder="0.25"
                className={cn(adminFieldClass, error && "border-red-400")}
              />
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, at) => at !== index))}
                aria-label={`Remove tier ${index + 1}`}
                className="inline-flex size-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-red-700"
              >
                <MaterialIcon name="delete" className="text-[20px]" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-[#f5f6f8] px-3 py-2.5 text-sm text-neutral-600">
          No quantity tiers. Every quantity gets only the base discount.
        </p>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={rows.length >= MAX_TIER_ROWS}
        onClick={() => onChange([...rows, { minQuantity: "", extra: "" }])}
        className={cn(adminButtonClass.quiet, "mt-2")}
      >
        <MaterialIcon name="add" className="text-[18px]" />
        Add tier
      </button>
    </div>
  );
}
