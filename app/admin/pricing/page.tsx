"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  parsePercent,
  parseTierRows,
  percentText,
  priceLine,
  tierRowsFrom,
  type TierRow,
} from "@/lib/mart-api/pricing";
import {
  getAdminPricingSettings,
  parseQuantityLimit,
  saveAdminPricingSettings,
  type PricingSettings,
} from "@/lib/mart-api/pricing-settings";
import { MartApiError } from "@/lib/mart-api/products";
import { formatTaka } from "@/lib/mart-mock/store";
import { cn } from "@/lib/utils";

import { adminFieldClass } from "../_components/admin-ui";
import { QuantityTiersEditor } from "../_components/quantity-tiers-editor";
import { MaterialIcon } from "@/app/(client)/_components/common/material-icon";

type Draft = { enabled: boolean; cap: string; maxQuantity: string; rows: TierRow[] };

function toDraft(settings: PricingSettings): Draft {
  return {
    enabled: settings.tiersEnabled,
    cap: percentText(settings.maxDiscountPercent),
    maxQuantity: String(settings.maxQuantityPerOrder),
    rows: tierRowsFrom(settings.tiers),
  };
}

// Worked example for the preview: ৳1,000 regular price with a 28 % base discount.
const EXAMPLE = { regular: 1000, price: 720, basePercent: 28 };

export default function AdminPricingPage() {
  const [stored, setStored] = useState<PricingSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminPricingSettings()
      .then((settings) => {
        if (cancelled) return;
        setStored(settings);
        setDraft(toDraft(settings));
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof MartApiError
              ? reason.message
              : "Discount settings could not be loaded.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cap = draft ? parsePercent(draft.cap) : null;
  const capError =
    draft && (cap == null || !draft.cap.trim())
      ? "Enter a maximum discount from 0 to 99.99%."
      : undefined;
  const maxQuantity = draft ? parseQuantityLimit(draft.maxQuantity) : null;
  const maxQuantityError =
    draft && maxQuantity == null ? "Enter a whole number from 1 to 1000." : undefined;
  const parsed = draft ? parseTierRows(draft.rows) : null;
  const tierError = parsed?.error ?? undefined;
  const invalid = Boolean(capError || maxQuantityError || tierError);
  const dirty =
    stored != null &&
    draft != null &&
    JSON.stringify(draft) !== JSON.stringify(toDraft(stored));

  function edit(patch: Partial<Draft>) {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
    setSaved(false);
    setError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || invalid || saving || cap == null || maxQuantity == null || !parsed?.tiers)
      return;
    setSaving(true);
    setError(null);
    try {
      const next = await saveAdminPricingSettings({
        tiersEnabled: draft.enabled,
        maxDiscountPercent: cap,
        maxQuantityPerOrder: maxQuantity,
        tiers: parsed.tiers,
      });
      setStored(next);
      setDraft(toDraft(next));
      setSaved(true);
    } catch (reason) {
      setError(
        reason instanceof MartApiError
          ? reason.message
          : "Discount settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const status = error
    ? error
    : stored == null
      ? "Loading"
      : invalid
        ? "Fix the highlighted fields"
        : saving
          ? "Saving"
          : dirty
            ? "Unsaved changes"
            : saved
              ? "Saved successfully"
              : "Up to date";

  const example =
    draft && parsed?.tiers && cap != null
      ? [1, ...parsed.tiers.map((tier) => tier.minQuantity)].map((quantity) =>
          priceLine({
            ...EXAMPLE,
            quantity,
            tiers: draft.enabled ? parsed.tiers : [],
            maxPercent: cap,
          }),
        )
      : [];
  const exampleQuantities = draft && parsed?.tiers
    ? [1, ...parsed.tiers.map((tier) => tier.minQuantity)]
    : [];

  return (
    <div className="w-full pb-10">
      <form
        onSubmit={save}
        className="overflow-hidden bg-white shadow-sm ring-1 ring-neutral-200/90 sm:rounded-2xl"
        data-testid="admin-pricing"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-neutral-100 bg-white/90 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-neutral-950">Quantity discounts</h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Each product has a regular price and a base discount %. Buying more pieces adds the extra % below, worked out on the regular price. The total never goes above the maximum.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <p className={cn("text-xs font-semibold", error ? "text-red-600" : dirty ? "text-amber-600" : "text-emerald-600")}>
              {status}
            </p>
            <button
              type="submit"
              disabled={!dirty || invalid || saving || stored == null}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg px-5 text-sm font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                !dirty || invalid || saving || stored == null
                  ? "bg-neutral-100 text-neutral-400"
                  : "bg-neutral-950 text-white hover:bg-neutral-800 active:scale-95",
              )}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        {/* Main Content - Full Width Split */}
        {draft ? (
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            
            {/* Left Side: Configuration */}
            <div className="space-y-4">
              {/* Store-wide Toggle */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200/80 bg-neutral-50 px-4 py-3 shadow-sm">
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-950">
                    Store-wide tiers
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">
                    Off: products on store-wide tiers get only their base discount. Products with custom tiers keep them.
                  </span>
                </div>
                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={draft.enabled}
                    disabled={saving}
                    onChange={() => edit({ enabled: !draft.enabled })}
                    aria-label={`Store-wide tiers ${draft.enabled ? "on" : "off"}`}
                  />
                  <div className="h-6 w-11 rounded-full bg-neutral-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 peer-disabled:opacity-50"></div>
                </label>
              </div>

              {/* Inputs Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pricing-cap" className="text-sm font-medium text-neutral-800">
                    Maximum total discount %
                  </label>
                  <input
                    id="pricing-cap"
                    inputMode="decimal"
                    value={draft.cap}
                    onChange={(event) => edit({ cap: event.target.value })}
                    aria-invalid={capError ? true : undefined}
                    className={cn(
                      adminFieldClass, 
                      "mt-1.5 h-10 text-sm", 
                      capError && "border-red-400 focus:border-red-500 focus:ring-red-200"
                    )}
                  />
                  <p className={cn("mt-1.5 text-[11px]", capError ? "text-red-600" : "text-neutral-500")}>
                    {capError ?? "Base + quantity discount is capped here. It can never reach 100%."}
                  </p>
                </div>
                <div>
                  <label htmlFor="pricing-max-quantity" className="text-sm font-medium text-neutral-800">
                    সর্বোচ্চ quantity প্রতি অর্ডার
                  </label>
                  <input
                    id="pricing-max-quantity"
                    inputMode="numeric"
                    value={draft.maxQuantity}
                    onChange={(event) => edit({ maxQuantity: event.target.value })}
                    aria-invalid={maxQuantityError ? true : undefined}
                    className={cn(
                      adminFieldClass, 
                      "mt-1.5 h-10 text-sm", 
                      maxQuantityError && "border-red-400 focus:border-red-500 focus:ring-red-200"
                    )}
                  />
                  <p className={cn("mt-1.5 text-[11px]", maxQuantityError ? "text-red-600" : "text-neutral-500")}>
                    {maxQuantityError ?? "Most pieces of one product per order. Tiers above the limit cannot be reached."}
                  </p>
                </div>
              </div>

              {/* Tiers Editor */}
              <div className="pt-2">
                <QuantityTiersEditor
                  id="pricing-tiers"
                  rows={draft.rows}
                  onChange={(rows) => edit({ rows })}
                  error={tierError}
                />
              </div>
            </div>

            {/* Right Side: Live Example Preview (Light Theme) */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm">
              <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-950">
                  <MaterialIcon name="receipt_long" className="text-[18px] text-primary" />
                  Live Example
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Regular {formatTaka(EXAMPLE.regular)} · Base discount {EXAMPLE.basePercent}%
                </p>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[10px] uppercase tracking-wider text-neutral-500">
                      <th className="px-4 py-2 text-left font-semibold">Pieces</th>
                      <th className="px-4 py-2 text-left font-semibold">Total Discount</th>
                      <th className="px-4 py-2 text-right font-semibold">Price / Each</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {example.map((line, index) => {
                      const isOverLimit = maxQuantity != null && exampleQuantities[index] > maxQuantity;
                      return (
                        <tr
                          key={exampleQuantities[index]}
                          className={cn(
                            "transition-colors hover:bg-neutral-50",
                            isOverLimit && "opacity-40 line-through"
                          )}
                        >
                          <td className="px-4 py-2.5 font-medium">{exampleQuantities[index]}</td>
                          <td className="px-4 py-2.5 text-primary font-medium">{percentText(line.totalPercent)}%</td>
                          <td className="px-4 py-2.5 text-right font-bold text-neutral-950">{formatTaka(line.unitPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {maxQuantity != null && (
                <div className="mt-auto border-t border-neutral-100 bg-neutral-50 px-4 py-2 text-[11px] text-neutral-500">
                  * Rows crossed out exceed the maximum order quantity ({maxQuantity}).
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            {error ? (
              <>
                <MaterialIcon name="error" className="mb-2 text-[32px] text-red-400" />
                <p className="text-sm font-medium text-red-600">{error}</p>
              </>
            ) : (
              <>
                <span className="mb-3 size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-primary" />
                <p className="text-sm text-neutral-500">Loading discount settings…</p>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
}